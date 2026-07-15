from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.orders import Order


@dataclass
class ShiprocketShipmentData:
    provider_order_id: str | None
    provider_shipment_id: str | None
    awb_number: str | None
    courier_company: str | None
    courier_company_id: str | None
    label_url: str | None
    invoice_url: str | None
    tracking_url: str | None
    pickup_token_number: str | None
    status: str
    raw_provider_payload: dict[str, Any]


class ShiprocketClient:
    def __init__(self) -> None:
        self.base_url = settings.SHIPROCKET_BASE_URL.rstrip("/")

    def create_order(self, order: Order) -> ShiprocketShipmentData:
        self._ensure_configured()
        token = self._authenticate()
        payload = self._build_order_payload(order)

        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(
                    f"{self.base_url}/orders/create/adhoc",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shiprocket order creation failed.",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach Shiprocket while creating shipment.",
            ) from exc

        data = self._json_response(response)
        return self._normalize_shipment_response(data)

    def _authenticate(self) -> str:
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    f"{self.base_url}/auth/login",
                    json={
                        "email": settings.SHIPROCKET_EMAIL,
                        "password": settings.SHIPROCKET_PASSWORD,
                    },
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shiprocket authentication failed.",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach Shiprocket while authenticating.",
            ) from exc

        data = self._json_response(response)
        token = data.get("token")
        if not isinstance(token, str) or not token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shiprocket authentication response did not include a token.",
            )
        return token

    @staticmethod
    def _json_response(response: httpx.Response) -> dict[str, Any]:
        try:
            data = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shiprocket returned an invalid response.",
            ) from exc
        if not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shiprocket returned an invalid response.",
            )
        return data

    def _ensure_configured(self) -> None:
        if not (
            settings.SHIPROCKET_BASE_URL
            and settings.SHIPROCKET_EMAIL
            and settings.SHIPROCKET_PASSWORD
            and settings.SHIPROCKET_PICKUP_LOCATION
        ):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Shiprocket is not configured.",
            )

    def _build_order_payload(self, order: Order) -> dict[str, Any]:
        address = order.address_snapshot or {}
        user = order.user
        customer_name = self._customer_name(order)
        first_name, last_name = self._split_name(customer_name)

        return {
            "order_id": f"rvbz-{order.id}",
            "order_date": order.created_at.strftime("%Y-%m-%d %H:%M"),
            "pickup_location": settings.SHIPROCKET_PICKUP_LOCATION,
            "billing_customer_name": first_name,
            "billing_last_name": last_name,
            "billing_address": address.get("street_address") or address.get("address") or "",
            "billing_city": address.get("city") or "",
            "billing_pincode": address.get("postal_code") or address.get("pincode") or "",
            "billing_state": address.get("state") or "",
            "billing_country": address.get("country") or "India",
            "billing_email": user.email or "customer@example.com",
            "billing_phone": user.phone,
            "shipping_is_billing": True,
            "order_items": [
                {
                    "name": item.product_name_snapshot,
                    "sku": item.product.sku if item.product else f"ITEM-{item.id}",
                    "units": item.quantity,
                    "selling_price": item.price_snapshot,
                }
                for item in order.items
            ],
            "payment_method": "COD" if order.payment_method == "cod" else "Prepaid",
            "sub_total": order.final_amount,
            "length": settings.SHIPROCKET_DEFAULT_LENGTH_CM,
            "breadth": settings.SHIPROCKET_DEFAULT_BREADTH_CM,
            "height": settings.SHIPROCKET_DEFAULT_HEIGHT_CM,
            "weight": settings.SHIPROCKET_DEFAULT_WEIGHT_KG,
        }

    @staticmethod
    def _customer_name(order: Order) -> str:
        user = order.user
        name = " ".join(
            part
            for part in (user.first_name, user.last_name)
            if isinstance(part, str) and part.strip()
        ).strip()
        return name or order.address_snapshot.get("title") or "Customer"

    @staticmethod
    def _split_name(name: str) -> tuple[str, str]:
        parts = name.split(" ", 1)
        if len(parts) == 1:
            return parts[0], ""
        return parts[0], parts[1]

    @staticmethod
    def _normalize_shipment_response(data: dict[str, Any]) -> ShiprocketShipmentData:
        nested = data.get("data") if isinstance(data.get("data"), dict) else {}
        awb_number = ShiprocketClient._first_string(
            data,
            nested,
            keys=("awb_code", "awb_number", "tracking_number"),
        )
        provider_status = str(
            nested.get("status") or data.get("status") or data.get("shipment_status") or ""
        ).lower()
        status_value = "shipped" if awb_number else "created"
        if "deliver" in provider_status:
            status_value = "delivered"
        elif "cancel" in provider_status:
            status_value = "cancelled"

        return ShiprocketShipmentData(
            provider_order_id=ShiprocketClient._first_string(data, nested, keys=("order_id",)),
            provider_shipment_id=ShiprocketClient._first_string(data, nested, keys=("shipment_id",)),
            awb_number=awb_number,
            courier_company=ShiprocketClient._first_string(
                data,
                nested,
                keys=("courier_name", "courier_company", "courier_company_name"),
            ),
            courier_company_id=ShiprocketClient._first_string(
                data,
                nested,
                keys=("courier_company_id", "courier_id"),
            ),
            label_url=ShiprocketClient._first_string(data, nested, keys=("label_url", "label")),
            invoice_url=ShiprocketClient._first_string(data, nested, keys=("invoice_url", "invoice")),
            tracking_url=ShiprocketClient._first_string(data, nested, keys=("tracking_url",)),
            pickup_token_number=ShiprocketClient._first_string(
                data,
                nested,
                keys=("pickup_token_number", "pickup_token"),
            ),
            status=status_value,
            raw_provider_payload=data,
        )

    @staticmethod
    def _first_string(*sources: dict[str, Any], keys: tuple[str, ...]) -> str | None:
        for source in sources:
            for key in keys:
                value = source.get(key)
                if value is not None:
                    return str(value)
        return None
