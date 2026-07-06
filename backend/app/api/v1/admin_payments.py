from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_current_admin, get_db
from app.schemas.payments import PaymentListResponse, Payment
from app.services.admin_payments import AdminPaymentService

router = APIRouter()

@router.get("", response_model=PaymentListResponse)
def list_admin_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    provider: Optional[str] = None,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminPaymentService(db)
    return service.list_payments(
        page=page,
        page_size=page_size,
        status=status,
        provider=provider
    )

@router.get("/{id}", response_model=Payment)
def get_admin_payment(
    id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminPaymentService(db)
    return service.get_payment(id)
