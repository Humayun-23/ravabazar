import hashlib
import json
import math

from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.orders import Order
from app.models.products import ProductStatus
from app.repositories.addresses import AddressRepository
from app.repositories.carts import CartRepository
from app.repositories.orders import OrderRepository
from app.repositories.coupons import CouponRepository
from app.schemas.orders import CheckoutRequest, OrderListResponse
from app.services.email import EmailService
from datetime import datetime


ONLINE_PAYMENT_METHODS = {"razorpay", "cashfree"}
SUPPORTED_PAYMENT_METHODS = ONLINE_PAYMENT_METHODS | {"cod"}
CANCELLABLE_STATUSES = {
    "pending_payment",
    "cod_pending",
    "confirmed",
    "packed",
}


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.addresses = AddressRepository(db)
        self.carts = CartRepository(db)
        self.orders = OrderRepository(db)
        self.coupons = CouponRepository(db)

    def checkout(
        self,
        *,
        user_id: int,
        payload: CheckoutRequest,
        idempotency_key: str,
        background_tasks: BackgroundTasks = None,
    ) -> Order:
        idempotency_key = idempotency_key.strip()
        if not idempotency_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Idempotency-Key is required.",
            )

        request_hash = self._request_hash(payload)
        existing_order = self.orders.get_by_idempotency_key(
            user_id=user_id,
            idempotency_key=idempotency_key,
        )
        if existing_order:
            if existing_order.idempotency_request_hash != request_hash:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency-Key was already used with a different request.",
                )
            return existing_order

        payment_method = payload.payment_method.lower()
        if payment_method not in SUPPORTED_PAYMENT_METHODS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported payment method.",
            )

        coupon = None
        if payload.coupon_code:
            coupon = self.coupons.get_by_code(payload.coupon_code)
            if not coupon:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Coupon not found.",
                )
            if not coupon.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon is not active.",
                )
            now = datetime.utcnow()
            if coupon.valid_from and now < coupon.valid_from:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon is not valid yet.",
                )
            if coupon.valid_until and now > coupon.valid_until:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon has expired.",
                )
            if coupon.usage_limit > 0 and coupon.usage_count >= coupon.usage_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon usage limit reached.",
                )

        address = self.addresses.get_by_id_and_user(payload.address_id, user_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found.",
            )

        cart = self.carts.get_cart(user_id=user_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty.",
            )

        total_amount = 0.0
        prepared_items = []
        for cart_item in cart.items:
            product = cart_item.product
            if not product or product.status != ProductStatus.active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart contains inactive products.",
                )

            inventory = (
                self.db.query(Inventory)
                .filter(Inventory.product_id == product.id)
                .with_for_update()
                .first()
            )
            available_stock = inventory.available_stock if inventory else 0
            if cart_item.quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Requested quantity exceeds available stock.",
                )

            price = product.sale_price if product.sale_price is not None else product.price
            line_total = price * cart_item.quantity
            total_amount += line_total
            prepared_items.append(
                {
                    "product": product,
                    "inventory": inventory,
                    "quantity": cart_item.quantity,
                    "price": price,
                }
            )

        if coupon and total_amount < coupon.min_order_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum order value of {coupon.min_order_value} required for this coupon.",
            )

        discount_amount = 0.0
        if coupon:
            if coupon.discount_type == "percentage":
                discount_amount = total_amount * (coupon.discount_value / 100.0)
            elif coupon.discount_type == "fixed":
                discount_amount = coupon.discount_value
            # Ensure discount doesn't exceed total_amount
            discount_amount = min(total_amount, discount_amount)

        shipping_fee = 0.0
        tax = 0.0
        final_amount = max(0, total_amount - discount_amount + shipping_fee + tax)
        order_status = "cod_pending" if payment_method == "cod" else "pending_payment"

        order = self.orders.create(
            user_id=user_id,
            address_snapshot=self._address_snapshot(address),
            total_amount=total_amount,
            discount_amount=discount_amount,
            coupon_code=coupon.code if coupon else None,
            shipping_fee=shipping_fee,
            tax=tax,
            final_amount=final_amount,
            status=order_status,
            payment_method=payment_method,
            idempotency_key=idempotency_key,
            idempotency_request_hash=request_hash,
        )

        if coupon:
            coupon.usage_count += 1
            self.db.add(coupon)

        for item in prepared_items:
            product = item["product"]
            quantity = item["quantity"]
            item["inventory"].reserved_quantity += quantity
            self.orders.add_item(
                order_id=order.id,
                product_id=product.id,
                product_name_snapshot=product.name,
                price_snapshot=item["price"],
                quantity=quantity,
            )

        self.carts.delete_cart(cart)
        self.db.commit()
        
        order_refreshed = self.orders.refresh_detail(order)
        
        if payment_method == "cod" and background_tasks:
            background_tasks.add_task(
                EmailService.send_order_success_email,
                email=order_refreshed.user.email,
                first_name=order_refreshed.user.first_name,
                order_id=order_refreshed.id,
                amount=order_refreshed.final_amount
            )
            
        return order_refreshed

    def list_my_orders(
        self,
        *,
        user_id: int,
        page: int,
        page_size: int,
    ) -> OrderListResponse:
        items, total = self.orders.list_for_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
        )
        total_pages = math.ceil(total / page_size) if total else 0
        return OrderListResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    def get_my_order(self, *, user_id: int, order_id: int) -> Order:
        order = self.orders.get_by_id_for_user(order_id, user_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )
        return order

    def cancel_order(self, *, user_id: int, order_id: int, reason: str | None = None, background_tasks: BackgroundTasks = None) -> Order:
        order = self.get_my_order(user_id=user_id, order_id=order_id)
        if order.status not in CANCELLABLE_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order cannot be cancelled.",
            )

        for item in order.items:
            if item.product and item.product.inventory:
                item.product.inventory.reserved_quantity = max(
                    0,
                    item.product.inventory.reserved_quantity - item.quantity,
                )

        if order.coupon_code:
            coupon = self.coupons.get_by_code(order.coupon_code)
            if coupon:
                coupon.usage_count = max(0, coupon.usage_count - 1)
                self.db.add(coupon)

        order.status = "cancelled"
        if reason:
            order.cancellation_reason = reason
            
        self.db.add(order)
        self.db.commit()
        
        order_refreshed = self.orders.refresh_detail(order)
        if background_tasks:
            background_tasks.add_task(
                EmailService.send_order_cancellation_email,
                email=order_refreshed.user.email,
                first_name=order_refreshed.user.first_name,
                order_id=order_refreshed.id
            )
            
        return order_refreshed

    @staticmethod
    def _address_snapshot(address) -> dict:
        return {
            "title": address.title,
            "street_address": address.street_address,
            "city": address.city,
            "state": address.state,
            "postal_code": address.postal_code,
            "country": address.country,
        }

    @staticmethod
    def _request_hash(payload: CheckoutRequest) -> str:
        raw = json.dumps(
            payload.model_dump(),
            sort_keys=True,
            separators=(",", ":"),
        )
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()
