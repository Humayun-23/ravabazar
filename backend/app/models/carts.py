from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(255), nullable=True, index=True) # for guest carts
    __table_args__ = (
        Index(
            "ix_carts_unique_user_id",
            "user_id",
            unique=True,
            postgresql_where=user_id.isnot(None),
            sqlite_where=user_id.isnot(None),
        ),
        Index(
            "ix_carts_unique_session_id",
            "session_id",
            unique=True,
            postgresql_where=session_id.isnot(None),
            sqlite_where=session_id.isnot(None),
        ),
    )
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="carts")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
