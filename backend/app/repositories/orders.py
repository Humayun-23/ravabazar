from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.order_items import OrderItem
from app.models.orders import Order
from app.models.products import Product


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id_for_user(self, order_id: int, user_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .filter(Order.id == order_id, Order.user_id == user_id)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.inventory),
                joinedload(Order.payment),
                joinedload(Order.shipment),
            )
            .first()
        )

    def get_by_idempotency_key(
        self,
        *,
        user_id: int,
        idempotency_key: str,
    ) -> Optional[Order]:
        return (
            self.db.query(Order)
            .filter(
                Order.user_id == user_id,
                Order.idempotency_key == idempotency_key,
            )
            .options(
                joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.inventory),
                joinedload(Order.payment),
                joinedload(Order.shipment),
            )
            .first()
        )

    def list_for_user(
        self,
        *,
        user_id: int,
        page: int,
        page_size: int,
    ) -> tuple[list[Order], int]:
        query = self.db.query(Order).filter(Order.user_id == user_id)
        total = query.count()
        orders = (
            query.order_by(Order.created_at.desc(), Order.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.inventory),
                joinedload(Order.payment),
                joinedload(Order.shipment),
            )
            .all()
        )
        return orders, total

    def create(
        self,
        *,
        user_id: int,
        address_snapshot: dict,
        total_amount: float,
        shipping_fee: float,
        tax: float,
        final_amount: float,
        status: str,
        payment_method: str,
        idempotency_key: str,
        idempotency_request_hash: str,
    ) -> Order:
        order = Order(
            user_id=user_id,
            address_snapshot=address_snapshot,
            total_amount=total_amount,
            shipping_fee=shipping_fee,
            tax=tax,
            final_amount=final_amount,
            status=status,
            payment_method=payment_method,
            idempotency_key=idempotency_key,
            idempotency_request_hash=idempotency_request_hash,
        )
        self.db.add(order)
        self.db.flush()
        return order

    def add_item(
        self,
        *,
        order_id: int,
        product_id: int | None,
        product_name_snapshot: str,
        price_snapshot: float,
        quantity: int,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name_snapshot=product_name_snapshot,
            price_snapshot=price_snapshot,
            quantity=quantity,
        )
        self.db.add(item)
        self.db.flush()
        return item

    def refresh_detail(self, order: Order) -> Order:
        self.db.refresh(order)
        return self.get_by_id_for_user(order.id, order.user_id)
