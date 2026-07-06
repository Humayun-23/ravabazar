from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

class PaymentBase(BaseModel):
    provider: str = Field(..., max_length=50)
    provider_order_id: Optional[str] = Field(None, max_length=255)
    provider_payment_id: Optional[str] = Field(None, max_length=255)
    amount: float
    status: Optional[str] = Field("pending", max_length=50)

class PaymentCreate(PaymentBase):
    order_id: int

class PaymentUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    provider_payment_id: Optional[str] = Field(None, max_length=255)

class PaymentInDBBase(PaymentBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Payment(PaymentInDBBase):
    pass


class PaymentCreateOrderRequest(BaseModel):
    order_id: int
    provider: str = Field(..., max_length=50)


class PaymentCreateOrderResponse(BaseModel):
    id: int
    order_id: int
    provider: str
    provider_order_id: str
    amount: float
    status: str
    client_payload: dict[str, Any]


class PaymentVerifyRequest(BaseModel):
    order_id: int
    provider: str = Field(..., max_length=50)
    provider_order_id: str = Field(..., max_length=255)
    provider_payment_id: str = Field(..., max_length=255)
    signature: str


class PaymentVerifyResponse(BaseModel):
    payment_id: int
    order_id: int
    status: str
    order_status: str


class PaymentWebhookResponse(BaseModel):
    received: bool

class PaymentListResponse(BaseModel):
    items: list[Payment] = []
    page: int
    page_size: int
    total: int
    total_pages: int
