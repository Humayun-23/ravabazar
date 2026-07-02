import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ProductStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    sale_price = Column(Float)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    status = Column(Enum(ProductStatus), default=ProductStatus.draft, nullable=False)
    is_featured = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
