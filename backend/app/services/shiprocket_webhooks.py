import hashlib
import hmac
import json
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.shipments import ShipmentRepository
from app.services.admin_orders import AdminOrderService
from app.schemas.admin_orders import AdminOrderStatusUpdate


class ShiprocketWebhookService:
    def __init__(self, db: Session):
        self.db = db
        self.shipments = ShipmentRepository(db)
        self.orders = AdminOrderService(db)

    def handle(self, *, raw_body: bytes, signature: str | None, token: str | None) -> dict[str, bool]:
        self._verify_webhook(raw_body=raw_body, signature=signature, token=token)
        payload = self._decode(raw_body)

        shipment = self.shipments.get_by_provider_reference(
            provider="shiprocket",
            provider_order_id=self._string(payload, "order_id"),
            provider_shipment_id=self._string(payload, "shipment_id"),
            awb_number=self._string(payload, "awb") or self._string(payload, "awb_code"),
        )
        if not shipment:
            return {"received": True}

        status_value = self._normalize_status(payload)
        update_data: dict[str, Any] = {
            "raw_provider_payload": payload,
        }
        awb_number = self._string(payload, "awb") or self._string(payload, "awb_code")
        if awb_number:
            update_data["awb_number"] = awb_number
            update_data["tracking_number"] = awb_number
        courier = (
            self._string(payload, "courier_name")
            or self._string(payload, "courier_company")
            or self._string(payload, "courier_company_name")
        )
        if courier:
            update_data["courier_company"] = courier
            update_data["courier_name"] = courier
        tracking_url = self._string(payload, "tracking_url")
        if tracking_url:
            update_data["tracking_url"] = tracking_url
        if status_value:
            update_data["status"] = status_value
        if status_value == "shipped":
            update_data["shipped_at"] = datetime.utcnow()
        elif status_value == "delivered":
            update_data["delivered_at"] = datetime.utcnow()

        shipment = self.shipments.update(shipment, **update_data)
        self._sync_order_status(shipment.order_id, shipment.order.status, status_value)
        return {"received": True}

    def _verify_webhook(
        self,
        *,
        raw_body: bytes,
        signature: str | None,
        token: str | None,
    ) -> None:
        secret = settings.SHIPROCKET_WEBHOOK_SECRET
        if not secret:
            return
        if token and hmac.compare_digest(token, secret):
            return
        if signature:
            expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
            if hmac.compare_digest(expected, signature):
                return
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Shiprocket webhook signature.",
        )

    @staticmethod
    def _decode(raw_body: bytes) -> dict[str, Any]:
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Shiprocket webhook payload.",
            ) from exc
        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Shiprocket webhook payload.",
            )
        return payload

    @staticmethod
    def _string(payload: dict[str, Any], key: str) -> str | None:
        value = payload.get(key)
        if value is None and isinstance(payload.get("data"), dict):
            value = payload["data"].get(key)
        if value is None:
            return None
        return str(value)

    def _normalize_status(self, payload: dict[str, Any]) -> str | None:
        raw_status = (
            self._string(payload, "current_status")
            or self._string(payload, "shipment_status")
            or self._string(payload, "status")
            or ""
        ).lower()
        if any(value in raw_status for value in ("delivered", "delivery done")):
            return "delivered"
        if any(value in raw_status for value in ("rto", "return", "returned")):
            return "returned"
        if any(value in raw_status for value in ("pickup", "transit", "shipped", "manifested")):
            return "shipped"
        if "cancel" in raw_status:
            return "cancelled"
        return None

    def _sync_order_status(self, order_id: int, order_status: str, shipment_status: str | None) -> None:
        if shipment_status == "shipped" and order_status == "packed":
            self.orders.update_status(
                order_id,
                AdminOrderStatusUpdate(status="shipped", note="Shiprocket webhook shipped"),
            )
        elif shipment_status == "delivered":
            if order_status == "packed":
                self.orders.update_status(
                    order_id,
                    AdminOrderStatusUpdate(status="shipped", note="Shiprocket webhook shipped"),
                )
                order_status = "shipped"
            if order_status == "shipped":
                self.orders.update_status(
                    order_id,
                    AdminOrderStatusUpdate(status="delivered", note="Shiprocket webhook delivered"),
                )
        elif shipment_status == "returned" and order_status in {"shipped", "delivered"}:
            self.orders.update_status(
                order_id,
                AdminOrderStatusUpdate(status="returned", note="Shiprocket webhook returned"),
            )
