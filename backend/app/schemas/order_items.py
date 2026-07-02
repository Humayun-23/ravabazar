from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name_snapshot: str = Field(..., max_length=255)
    price_snapshot: float
    quantity: int

class OrderItemCreate(OrderItemBase):
    order_id: int

class OrderItemUpdate(BaseModel):
    pass

class OrderItemInDBBase(OrderItemBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderItem(OrderItemInDBBase):
    pass
