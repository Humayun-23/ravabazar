from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ShipmentBase(BaseModel):
    tracking_number: Optional[str] = Field(None, max_length=255)
    courier_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field("processing", max_length=50)
    provider: Optional[str] = Field("manual", max_length=50)
    provider_order_id: Optional[str] = Field(None, max_length=255)
    provider_shipment_id: Optional[str] = Field(None, max_length=255)
    awb_number: Optional[str] = Field(None, max_length=255)
    courier_company: Optional[str] = Field(None, max_length=100)
    courier_company_id: Optional[str] = Field(None, max_length=100)
    label_url: Optional[str] = Field(None, max_length=500)
    invoice_url: Optional[str] = Field(None, max_length=500)
    tracking_url: Optional[str] = Field(None, max_length=500)
    pickup_token_number: Optional[str] = Field(None, max_length=255)
    raw_provider_payload: Optional[dict] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

class ShipmentCreate(ShipmentBase):
    order_id: int

class ShipmentUpdate(BaseModel):
    tracking_number: Optional[str] = Field(None, max_length=255)
    courier_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    provider_order_id: Optional[str] = Field(None, max_length=255)
    provider_shipment_id: Optional[str] = Field(None, max_length=255)
    awb_number: Optional[str] = Field(None, max_length=255)
    courier_company: Optional[str] = Field(None, max_length=100)
    courier_company_id: Optional[str] = Field(None, max_length=100)
    label_url: Optional[str] = Field(None, max_length=500)
    invoice_url: Optional[str] = Field(None, max_length=500)
    tracking_url: Optional[str] = Field(None, max_length=500)
    pickup_token_number: Optional[str] = Field(None, max_length=255)

class ShipmentInDBBase(ShipmentBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Shipment(ShipmentInDBBase):
    pass
