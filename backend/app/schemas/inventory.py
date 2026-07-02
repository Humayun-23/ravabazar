from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class InventoryBase(BaseModel):
    stock_quantity: int = 0
    reserved_quantity: int = 0
    low_stock_threshold: int = 5

    @field_validator('stock_quantity', 'reserved_quantity', 'low_stock_threshold')
    @classmethod
    def check_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity must be greater than or equal to 0')
        return v

class InventoryCreate(InventoryBase):
    product_id: int

class InventoryUpdate(BaseModel):
    stock_quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None

    @field_validator('stock_quantity', 'reserved_quantity', 'low_stock_threshold')
    @classmethod
    def check_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity must be greater than or equal to 0')
        return v

class InventoryInDBBase(InventoryBase):
    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Inventory(InventoryInDBBase):
    available_stock: int
