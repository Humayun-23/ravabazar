from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import enum
from .product_images import ProductImage

class ProductStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    sku: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float
    sale_price: Optional[float] = None
    category_id: Optional[int] = None
    status: ProductStatus = ProductStatus.draft
    is_featured: Optional[bool] = False

    @field_validator('sku')
    @classmethod
    def uppercase_sku(cls, v):
        if v:
            return v.strip().upper()
        return v

    @field_validator('price', 'sale_price')
    @classmethod
    def check_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be greater than or equal to 0')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    category_id: Optional[int] = None
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None

    @field_validator('sku')
    @classmethod
    def uppercase_sku(cls, v):
        if v:
            return v.strip().upper()
        return v

    @field_validator('price', 'sale_price')
    @classmethod
    def check_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be greater than or equal to 0')
        return v

class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Product(ProductInDBBase):
    images: List[ProductImage] = []
