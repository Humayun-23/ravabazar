from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductImageBase(BaseModel):
    image_url: str = Field(..., max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: Optional[bool] = False

class ProductImageCreate(ProductImageBase):
    product_id: int

class ProductImageUpdate(BaseModel):
    image_url: Optional[str] = Field(None, max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: Optional[bool] = None

class ProductImageInDBBase(ProductImageBase):
    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductImage(ProductImageInDBBase):
    pass
