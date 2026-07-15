from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    tracking_number = Column(String(255))
    courier_name = Column(String(100))
    status = Column(String(50), default="processing")
    provider = Column(String(50), default="manual")
    provider_order_id = Column(String(255))
    provider_shipment_id = Column(String(255))
    awb_number = Column(String(255))
    courier_company = Column(String(100))
    courier_company_id = Column(String(100))
    label_url = Column(String(500))
    invoice_url = Column(String(500))
    tracking_url = Column(String(500))
    pickup_token_number = Column(String(255))
    raw_provider_payload = Column(JSONB().with_variant(JSON(), "sqlite"))
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="shipment")
