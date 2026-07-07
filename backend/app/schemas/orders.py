from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from .order_items import OrderItem
from .payments import Payment
from .shipments import Shipment

class OrderBase(BaseModel):
    user_id: int
    address_snapshot: Any
    total_amount: float
    discount_amount: Optional[float] = 0.0
    coupon_code: Optional[str] = Field(None, max_length=50)
    shipping_fee: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    final_amount: float
    status: Optional[str] = Field("pending_payment", max_length=50)
    cancellation_reason: Optional[str] = Field(None, max_length=500)
    payment_method: str = Field(..., max_length=50)

class OrderCreate(OrderBase):
    pass


class CheckoutRequest(BaseModel):
    address_id: int
    payment_method: str = Field(..., max_length=50)
    coupon_code: Optional[str] = Field(None, max_length=50)

    @field_validator("payment_method")
    @classmethod
    def normalize_payment_method(cls, value: str) -> str:
        return value.lower()


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class OrderUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)

class OrderInDBBase(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Order(OrderInDBBase):
    items: List[OrderItem] = []
    payment: Optional[Payment] = None
    shipment: Optional[Shipment] = None


class OrderListResponse(BaseModel):
    items: List[Order] = []
    page: int
    page_size: int
    total: int
    total_pages: int
