from fastapi import APIRouter, Depends, Header, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.users import User
from app.schemas.payments import (
    PaymentCreateOrderRequest,
    PaymentCreateOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentWebhookResponse,
)
from app.services.payments import PaymentService

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok", "module": "payments"}


@router.post(
    "/create-order",
    response_model=PaymentCreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_order(
    payload: PaymentCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).create_order(
        user_id=current_user.id,
        payload=payload,
    )


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).verify(
        user_id=current_user.id,
        payload=payload,
        background_tasks=background_tasks,
    )


@router.post("/webhook", response_model=PaymentWebhookResponse)
async def payment_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: str | None = Header(None, alias="X-Razorpay-Signature"),
    x_cashfree_signature: str | None = Header(None, alias="X-Cashfree-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    if x_razorpay_signature and x_cashfree_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiple payment webhook signatures supplied.",
        )
    if x_razorpay_signature:
        return PaymentService(db).handle_webhook(
            provider="razorpay",
            signature=x_razorpay_signature,
            raw_body=raw_body,
            background_tasks=background_tasks,
        )
    if x_cashfree_signature:
        return PaymentService(db).handle_webhook(
            provider="cashfree",
            signature=x_cashfree_signature,
            raw_body=raw_body,
            background_tasks=background_tasks,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Missing payment webhook signature.",
    )
