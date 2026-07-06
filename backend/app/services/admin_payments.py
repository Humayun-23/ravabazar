import math
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.payments import PaymentRepository
from app.schemas.payments import PaymentListResponse
from app.models.payments import Payment

class AdminPaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PaymentRepository(db)

    def list_payments(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> PaymentListResponse:
        payments, total = self.repo.list_all_admin(
            page=page,
            page_size=page_size,
            status=status,
            provider=provider
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return PaymentListResponse(
            items=payments,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def get_payment(self, payment_id: int) -> Payment:
        payment = self.repo.get_by_id_admin(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
