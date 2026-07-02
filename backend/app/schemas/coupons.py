from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CouponBase(BaseModel):
    code: str = Field(..., max_length=50)
    discount_type: str = Field(..., max_length=50)
    discount_value: float
    min_order_value: Optional[float] = 0.0
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = 0
    is_active: Optional[bool] = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    discount_type: Optional[str] = Field(None, max_length=50)
    discount_value: Optional[float] = None
    min_order_value: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

class CouponInDBBase(CouponBase):
    id: int
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Coupon(CouponInDBBase):
    pass
