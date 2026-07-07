from pydantic import BaseModel
from typing import List
from datetime import datetime
from .products import ProductPublic

class WishlistAddRequest(BaseModel):
    product_id: int

class WishlistItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: datetime
    product: ProductPublic

    class Config:
        from_attributes = True
