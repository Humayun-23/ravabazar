from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .cart_items import CartItemPublic

class CartBase(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = Field(None, max_length=255)

class CartMergeRequest(BaseModel):
    session_id: str

class CartInDBBase(CartBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CartPublic(BaseModel):
    id: int
    user_id: Optional[int]
    session_id: Optional[str]
    items: List[CartItemPublic] = []
    subtotal: float

    class Config:
        from_attributes = True
