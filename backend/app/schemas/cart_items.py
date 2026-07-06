from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .products import ProductPublic

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemAddRequest(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdateRequest(BaseModel):
    quantity: int

class CartItemInDBBase(CartItemBase):
    id: int
    cart_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CartItemPublic(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductPublic
    line_total: float

    class Config:
        from_attributes = True
