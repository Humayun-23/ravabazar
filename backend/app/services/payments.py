import hashlib
import hmac
import json
from uuid import uuid4

import httpx
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.orders import Order
from app.models.payments import Payment
from app.repositories.orders import OrderRepository
from app.repositories.payments import PaymentRepository
from app.schemas.payments import (
    PaymentCreateOrderRequest,
    PaymentCreateOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentWebhookResponse,
)
from app.services.email import EmailService


ONLINE_PAYMENT_PROVIDERS = {"razorpay", "cashfree"}
SUCCESS_PAYMENT_STATUSES = {"captured", "paid", "success", "successful", "verified"}
FAILED_PAYMENT_STATUSES = {"failed", "failure", "cancelled", "canceled"}


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)
        self.payments = PaymentRepository(db)

    def create_order(
        self,
        *,
        user_id: int,
        payload: PaymentCreateOrderRequest,
    ) -> PaymentCreateOrderResponse:
        provider = self._normalize_provider(payload.provider)
        self._ensure_provider_can_create_order(provider)

        order = self.orders.get_by_id_for_user(payload.order_id, user_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )
        if order.status != "pending_payment":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment can only be created for pending online-payment orders.",
            )
        if order.payment_method != provider:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment provider does not match the order payment method.",
            )

        payment = self.payments.get_by_order_id(order.id)
        if payment:
            if payment.provider != provider:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Order already has a payment with another provider.",
                )
            if payment.status not in {"pending", "created", "failed"}:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Order payment cannot be recreated.",
                )
            if payment.status == "created" and payment.provider_order_id:
                payment.amount = order.final_amount
                self.db.add(payment)
                self.db.commit()
                payment = self.payments.refresh(payment)
                return self._create_order_response(payment)

            payment.status = "created"
            payment.amount = order.final_amount
            payment.provider_payment_id = None
            payment.provider_order_id = self._create_provider_order_id(provider, order)
            self.db.add(payment)
        else:
            payment = self.payments.create(
                order_id=order.id,
                provider=provider,
                provider_order_id=self._create_provider_order_id(provider, order),
                amount=order.final_amount,
                status="created",
            )

        self.db.commit()
        payment = self.payments.refresh(payment)
        return self._create_order_response(payment)

    def verify(
        self,
        *,
        user_id: int,
        payload: PaymentVerifyRequest,
        background_tasks: BackgroundTasks = None,
    ) -> PaymentVerifyResponse:
        provider = self._normalize_provider(payload.provider)
        self._ensure_provider_secret(provider)

        order = self.orders.get_by_id_for_user(payload.order_id, user_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        payment = self.payments.get_by_order_id(order.id)
        if (
            not payment
            or payment.provider != provider
            or payment.provider_order_id != payload.provider_order_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found.",
            )

        if not self._can_accept_success(payment):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order cannot accept payment verification.",
            )

        if not self._verify_payment_signature(
            provider=provider,
            provider_order_id=payload.provider_order_id,
            provider_payment_id=payload.provider_payment_id,
            signature=payload.signature,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature.",
            )

        self._mark_success(payment, payload.provider_payment_id, background_tasks)
        self.db.commit()
        payment = self.payments.refresh(payment)
        return PaymentVerifyResponse(
            payment_id=payment.id,
            order_id=payment.order_id,
            status=payment.status,
            order_status=payment.order.status,
        )

    def handle_webhook(
        self,
        *,
        provider: str,
        signature: str,
        raw_body: bytes,
        background_tasks: BackgroundTasks = None,
    ) -> PaymentWebhookResponse:
        provider = self._normalize_provider(provider)
        if not self._verify_webhook_signature(
            provider=provider,
            signature=signature,
            raw_body=raw_body,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature.",
            )

        payload = self._decode_webhook_payload(raw_body)
        provider_order_id = self._extract_provider_order_id(payload)
        if not provider_order_id:
            return PaymentWebhookResponse(received=True)

        payment = self.payments.get_by_provider_order_id(
            provider=provider,
            provider_order_id=provider_order_id,
        )
        if not payment:
            return PaymentWebhookResponse(received=True)

        outcome = self._extract_webhook_outcome(payload)
        provider_payment_id = self._extract_provider_payment_id(payload)
        if outcome == "success":
            self._mark_success(payment, provider_payment_id, background_tasks)
            self.db.commit()
        elif outcome == "failed":
            self._mark_failed(payment, provider_payment_id)
            self.db.commit()

        return PaymentWebhookResponse(received=True)

    def _create_order_response(self, payment: Payment) -> PaymentCreateOrderResponse:
        return PaymentCreateOrderResponse(
            id=payment.id,
            order_id=payment.order_id,
            provider=payment.provider,
            provider_order_id=payment.provider_order_id,
            amount=payment.amount,
            status=payment.status,
            client_payload={
                "key": self._provider_public_key(payment.provider),
                "order_id": payment.provider_order_id,
                "amount": self._amount_to_subunits(payment.amount),
                "currency": settings.PAYMENT_CURRENCY,
                "name": "Ravabazar",
                "description": f"Order #{payment.order_id}",
            },
        )

    @staticmethod
    def _normalize_provider(provider: str) -> str:
        provider = provider.lower().strip()
        if provider not in ONLINE_PAYMENT_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported payment provider.",
            )
        return provider

    @staticmethod
    def _new_provider_order_id(provider: str, order_id: int) -> str:
        return f"order_{provider}_{order_id}_{uuid4().hex[:12]}"

    def _create_provider_order_id(self, provider: str, order: Order) -> str:
        if provider == "razorpay":
            return self._create_razorpay_order(order)
        return self._new_provider_order_id(provider, order.id)

    def _create_razorpay_order(self, order: Order) -> str:
        payload = {
            "amount": self._amount_to_subunits(order.final_amount),
            "currency": settings.PAYMENT_CURRENCY,
            "receipt": f"rvbz_order_{order.id}",
            "notes": {
                "ravabazar_order_id": str(order.id),
                "ravabazar_user_id": str(order.user_id),
            },
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    "https://api.razorpay.com/v1/orders",
                    json=payload,
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Razorpay order creation failed.",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach Razorpay while creating payment order.",
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Razorpay returned an invalid order response.",
            ) from exc

        provider_order_id = data.get("id")
        if not isinstance(provider_order_id, str) or not provider_order_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Razorpay order response did not include an order id.",
            )
        return provider_order_id

    @staticmethod
    def _amount_to_subunits(amount: float) -> int:
        return int(round(amount * 100))

    @staticmethod
    def _provider_public_key(provider: str) -> str:
        if provider == "razorpay":
            return settings.RAZORPAY_KEY_ID
        return settings.CASHFREE_APP_ID

    def _provider_secret(self, provider: str) -> str:
        if provider == "razorpay":
            return settings.RAZORPAY_KEY_SECRET
        return settings.CASHFREE_SECRET_KEY

    def _webhook_secret(self, provider: str) -> str:
        if provider == "razorpay":
            return settings.RAZORPAY_WEBHOOK_SECRET or settings.RAZORPAY_KEY_SECRET
        return settings.CASHFREE_WEBHOOK_SECRET or settings.CASHFREE_SECRET_KEY

    def _ensure_provider_can_create_order(self, provider: str) -> None:
        if not self._provider_public_key(provider) or not self._provider_secret(provider):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment provider is not configured.",
            )

    def _ensure_provider_secret(self, provider: str) -> None:
        if not self._provider_secret(provider):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment provider secret is not configured.",
            )

    def _verify_payment_signature(
        self,
        *,
        provider: str,
        provider_order_id: str,
        provider_payment_id: str,
        signature: str,
    ) -> bool:
        message = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
        expected = hmac.new(
            self._provider_secret(provider).encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def _verify_webhook_signature(
        self,
        *,
        provider: str,
        signature: str,
        raw_body: bytes,
    ) -> bool:
        secret = self._webhook_secret(provider)
        if not secret:
            return False
        expected = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    @staticmethod
    def _decode_webhook_payload(raw_body: bytes) -> dict:
        try:
            decoded = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook payload.",
            ) from exc
        if not isinstance(decoded, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook payload.",
            )
        return decoded

    @staticmethod
    def _extract_provider_order_id(payload: dict) -> str | None:
        return (
            payload.get("provider_order_id")
            or payload.get("order_id")
            or payload.get("data", {}).get("order", {}).get("order_id")
            or payload.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
        )

    @staticmethod
    def _extract_provider_payment_id(payload: dict) -> str | None:
        return (
            payload.get("provider_payment_id")
            or payload.get("payment_id")
            or payload.get("cf_payment_id")
            or payload.get("data", {}).get("payment", {}).get("cf_payment_id")
            or payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
        )

    @staticmethod
    def _extract_webhook_outcome(payload: dict) -> str | None:
        event = str(payload.get("event", "")).lower()
        status_value = str(
            payload.get("status")
            or payload.get("payment_status")
            or payload.get("data", {}).get("payment", {}).get("payment_status")
            or payload.get("payload", {}).get("payment", {}).get("entity", {}).get("status")
            or ""
        ).lower()

        if any(value in event for value in ("captured", "paid", "success")):
            return "success"
        if status_value in SUCCESS_PAYMENT_STATUSES:
            return "success"
        if "failed" in event or status_value in FAILED_PAYMENT_STATUSES:
            return "failed"
        return None

    def _mark_success(self, payment: Payment, provider_payment_id: str | None, background_tasks: BackgroundTasks = None) -> None:
        if payment.status == "verified" and payment.order.status == "paid":
            return
        if not self._can_accept_success(payment):
            return
            
        was_pending = payment.order.status == "pending_payment"
        
        if provider_payment_id:
            payment.provider_payment_id = provider_payment_id
        payment.status = "verified"
        payment.order.status = "paid"
        self.db.add(payment.order)
        self.db.add(payment)
        
        if was_pending and background_tasks:
            background_tasks.add_task(
                EmailService.send_order_success_email,
                email=payment.order.user.email,
                first_name=payment.order.user.first_name,
                order_id=payment.order.id,
                amount=payment.order.final_amount
            )

    @staticmethod
    def _can_accept_success(payment: Payment) -> bool:
        return (
            payment.order.status == "pending_payment"
            or (payment.status == "verified" and payment.order.status == "paid")
        )

    def _mark_failed(self, payment: Payment, provider_payment_id: str | None) -> None:
        if payment.status == "verified" or payment.order.status == "paid":
            return
        if provider_payment_id:
            payment.provider_payment_id = provider_payment_id
        payment.status = "failed"
        if payment.order.status == "pending_payment":
            payment.order.status = "failed"
        self.db.add(payment.order)
        self.db.add(payment)
