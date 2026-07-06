from pydantic import BaseModel
from typing import List

class InventoryItemResponse(BaseModel):
    product_id: int
    sku: str
    product_name: str
    stock_quantity: int
    reserved_quantity: int
    available_stock: int
    low_stock_threshold: int

class InventoryListResponse(BaseModel):
    items: List[InventoryItemResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
