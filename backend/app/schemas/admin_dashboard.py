from pydantic import BaseModel
from typing import List

class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str | None
    stock_quantity: int
    reserved_quantity: int
    available_stock: int

class DashboardResponse(BaseModel):
    total_sales: float
    total_orders: int
    pending_orders: int
    total_customers: int
    low_stock_alerts: List[LowStockProduct]
