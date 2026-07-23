from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ProductReviewCreate(ProductReviewBase):
    pass

class ProductReviewUser(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]

    class Config:
        from_attributes = True

class ProductReviewResponse(ProductReviewBase):
    id: int
    product_id: int
    user_id: int
    user: Optional[ProductReviewUser] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
