from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

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
