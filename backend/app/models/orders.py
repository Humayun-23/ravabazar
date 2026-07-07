from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_snapshot = Column(JSONB().with_variant(JSON(), "sqlite"), nullable=False)
    idempotency_key = Column(String(255), nullable=True)
    idempotency_request_hash = Column(String(64), nullable=True)
    __table_args__ = (
        Index(
            "ix_orders_user_id_idempotency_key",
            "user_id",
            "idempotency_key",
            unique=True,
            postgresql_where=text("idempotency_key IS NOT NULL"),
            sqlite_where=text("idempotency_key IS NOT NULL"),
        ),
    )
    
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    coupon_code = Column(String(50), nullable=True)
    shipping_fee = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    status = Column(String(50), default="pending_payment")
    cancellation_reason = Column(String(500), nullable=True)
    payment_method = Column(String(50), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    shipment = relationship("Shipment", back_populates="order", uselist=False)
