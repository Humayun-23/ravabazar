from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .products import Product

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    cart_id: int

class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None

class CartItemInDBBase(CartItemBase):
    id: int
    cart_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CartItem(CartItemInDBBase):
    product: Optional[Product] = None
