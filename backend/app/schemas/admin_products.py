from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from .products import ProductBase, ProductStatus

class InventoryCreateNested(BaseModel):
    stock_quantity: int = 0
    reserved_quantity: int = 0
    low_stock_threshold: int = 5

    @field_validator('stock_quantity', 'reserved_quantity', 'low_stock_threshold')
    @classmethod
    def check_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity must be greater than or equal to 0')
        return v

class InventoryUpdateNested(BaseModel):
    stock_quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None

    @field_validator('stock_quantity', 'reserved_quantity', 'low_stock_threshold')
    @classmethod
    def check_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity must be greater than or equal to 0')
        return v

class ImageCreateNested(BaseModel):
    image_url: str = Field(..., max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: Optional[bool] = False

class AdminProductCreate(ProductBase):
    inventory: InventoryCreateNested = Field(default_factory=InventoryCreateNested)
    images: List[ImageCreateNested] = []

class AdminProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    category_id: Optional[int] = None
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None
    
    inventory: Optional[InventoryUpdateNested] = None
    images: Optional[List[ImageCreateNested]] = None

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
