from fastapi import APIRouter, Depends, Header, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.users import User
from app.schemas.orders import (
    CheckoutRequest,
    Order,
    OrderCancelRequest,
    OrderListResponse,
)
from app.services.orders import OrderService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "orders"}


@router.post("", response_model=Order, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    background_tasks: BackgroundTasks,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).checkout(
        user_id=current_user.id,
        payload=payload,
        idempotency_key=idempotency_key,
        background_tasks=background_tasks,
    )


@router.get("/my", response_model=OrderListResponse)
def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).list_my_orders(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=Order)
def get_my_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).get_my_order(
        user_id=current_user.id,
        order_id=order_id,
    )


@router.post("/{order_id}/cancel", response_model=Order)
def cancel_my_order(
    order_id: int,
    payload: OrderCancelRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).cancel_order(
        user_id=current_user.id,
        order_id=order_id,
        reason=payload.reason,
        background_tasks=background_tasks,
    )
