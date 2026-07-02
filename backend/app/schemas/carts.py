from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .cart_items import CartItem

class CartBase(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = Field(None, max_length=255)

class CartCreate(CartBase):
    pass

class CartUpdate(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = Field(None, max_length=255)

class CartInDBBase(CartBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Cart(CartInDBBase):
    items: List[CartItem] = []
