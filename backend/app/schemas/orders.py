from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from .order_items import OrderItem
from .payments import Payment
from .shipments import Shipment

class OrderBase(BaseModel):
    user_id: int
    address_snapshot: Any
    total_amount: float
    shipping_fee: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    final_amount: float
    status: Optional[str] = Field("pending_payment", max_length=50)
    payment_method: str = Field(..., max_length=50)

class OrderCreate(OrderBase):
    pass

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
