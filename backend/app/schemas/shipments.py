from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ShipmentBase(BaseModel):
    tracking_number: Optional[str] = Field(None, max_length=255)
    courier_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field("processing", max_length=50)

class ShipmentCreate(ShipmentBase):
    order_id: int

class ShipmentUpdate(BaseModel):
    tracking_number: Optional[str] = Field(None, max_length=255)
    courier_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)

class ShipmentInDBBase(ShipmentBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Shipment(ShipmentInDBBase):
    pass
