from fastapi import APIRouter, Depends, Query, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_current_admin, get_db
from app.schemas.orders import OrderListResponse, Order
from app.schemas.admin_orders import AdminOrderStatusUpdate
from app.services.admin_orders import AdminOrderService

router = APIRouter()

@router.get("", response_model=OrderListResponse)
def list_admin_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    customer_id: Optional[int] = None,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminOrderService(db)
    return service.list_orders(
        page=page,
        page_size=page_size,
        status=status,
        payment_method=payment_method,
        customer_id=customer_id
    )

@router.get("/{id}", response_model=Order)
def get_admin_order(
    id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminOrderService(db)
    return service.get_order(id)

@router.patch("/{id}/status", response_model=Order)
def update_admin_order_status(
    id: int,
    payload: AdminOrderStatusUpdate,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    service = AdminOrderService(db)
    return service.update_status(id, payload, background_tasks)
