from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.payments import Payment


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_order_id(self, order_id: int) -> Optional[Payment]:
        return (
            self.db.query(Payment)
            .filter(Payment.order_id == order_id)
            .options(joinedload(Payment.order))
            .first()
        )

    def get_by_id_admin(self, payment_id: int) -> Optional[Payment]:
        return (
            self.db.query(Payment)
            .filter(Payment.id == payment_id)
            .options(joinedload(Payment.order))
            .first()
        )

    def list_all_admin(
        self,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> tuple[list[Payment], int]:
        query = self.db.query(Payment)
        
        if status:
            query = query.filter(Payment.status == status)
        if provider:
            query = query.filter(Payment.provider == provider)
            
        total = query.count()
        payments = (
            query.order_by(Payment.created_at.desc(), Payment.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(joinedload(Payment.order))
            .all()
        )
        return payments, total

    def get_by_provider_order_id(
        self,
        *,
        provider: str,
        provider_order_id: str,
    ) -> Optional[Payment]:
        return (
            self.db.query(Payment)
            .filter(
                Payment.provider == provider,
                Payment.provider_order_id == provider_order_id,
            )
            .options(joinedload(Payment.order))
            .first()
        )

    def create(
        self,
        *,
        order_id: int,
        provider: str,
        provider_order_id: str,
        amount: float,
        status: str,
    ) -> Payment:
        payment = Payment(
            order_id=order_id,
            provider=provider,
            provider_order_id=provider_order_id,
            amount=amount,
            status=status,
        )
        self.db.add(payment)
        self.db.flush()
        return payment

    def refresh(self, payment: Payment) -> Payment:
        self.db.refresh(payment)
        return self.get_by_order_id(payment.order_id)
