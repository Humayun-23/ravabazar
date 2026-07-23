import math
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks

from app.repositories.orders import OrderRepository
from app.repositories.coupons import CouponRepository
from app.schemas.orders import OrderListResponse
from app.schemas.admin_orders import AdminOrderStatusUpdate
from app.models.orders import Order
from app.services.email import EmailService

# Valid transition map
ALLOWED_TRANSITIONS = {
    "pending_payment": ["cancelled"],
    "paid": ["processing", "cancelled"],
    "cod_pending": ["processing", "cancelled"],
    "processing": ["packed", "cancelled"],
    "packed": ["shipped", "cancelled"],
    "shipped": ["delivered", "returned", "cancelled"],
    "delivered": ["returned"],
    "cancelled": ["refunded"],
    "returned": ["refunded"],
    "refunded": []
}

class AdminOrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrderRepository(db)
        self.coupons = CouponRepository(db)

    def list_orders(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        payment_method: Optional[str] = None,
        customer_id: Optional[int] = None,
    ) -> OrderListResponse:
        orders, total = self.repo.list_all_admin(
            page=page,
            page_size=page_size,
            status=status,
            payment_method=payment_method,
            customer_id=customer_id
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return OrderListResponse(
            items=orders,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def get_order(self, order_id: int) -> Order:
        order = self.repo.get_by_id_admin(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    def update_status(self, order_id: int, payload: AdminOrderStatusUpdate, background_tasks: BackgroundTasks = None) -> Order:
        order = self.repo.get_by_id_admin(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        current_status = order.status
        new_status = payload.status
        
        if new_status not in ALLOWED_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid transition from {current_status} to {new_status}"
            )
            
        if new_status == "shipped" and current_status == "packed":
            # Physically reduce stock when order leaves warehouse
            for item in order.items:
                if item.product and item.product.inventory:
                    inventory = item.product.inventory
                    inventory.stock_quantity = max(0, inventory.stock_quantity - item.quantity)
                    inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)
                    
        elif new_status == "cancelled" and current_status in {
            "pending_payment",
            "paid",
            "cod_pending",
            "processing",
            "packed",
        }:
            # Free up reserved stock if cancelled before shipping
            for item in order.items:
                if item.product and item.product.inventory:
                    inventory = item.product.inventory
                    inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)
                    
            if order.coupon_code:
                coupon = self.coupons.get_by_code(order.coupon_code)
                if coupon:
                    coupon.usage_count = max(0, coupon.usage_count - 1)
                    self.db.add(coupon)
                    
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_order_cancellation_email,
                    email=order.user.email,
                    first_name=order.user.first_name,
                    order_id=order.id
                )
                    
        updated_order = self.repo.update_status(order, new_status)
        
        # Send Push Notification
        from app.services.notification_service import NotificationService
        notif_svc = NotificationService(self.db)
        if background_tasks:
            background_tasks.add_task(
                notif_svc.send_push_notification,
                user_id=order.user_id,
                title="Order Status Updated",
                body=f"Your order #{order.id} is now {new_status}.",
                notification_type="order_status",
                related_id=order.id
            )
        else:
            notif_svc.send_push_notification(
                user_id=order.user_id,
                title="Order Status Updated",
                body=f"Your order #{order.id} is now {new_status}.",
                notification_type="order_status",
                related_id=order.id
            )

        return updated_order

