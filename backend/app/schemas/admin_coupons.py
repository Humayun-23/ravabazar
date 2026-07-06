from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CouponBase(BaseModel):
    code: str = Field(..., max_length=50)
    discount_type: str = Field(..., description="fixed or percentage")
    discount_value: float = Field(..., gt=0)
    min_order_value: float = Field(0.0, ge=0)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: int = Field(0, ge=0, description="0 means unlimited")
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    discount_type: Optional[str] = None
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_value: Optional[float] = Field(None, ge=0)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CouponListResponse(BaseModel):
    items: List[CouponResponse] = []
    page: int
    page_size: int
    total: int
    total_pages: int
