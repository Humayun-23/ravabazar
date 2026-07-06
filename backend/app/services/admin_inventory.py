import math
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.inventory import Inventory
from app.models.products import Product
from app.schemas.inventory import InventoryUpdate
from app.schemas.admin_inventory import InventoryListResponse, InventoryItemResponse

class AdminInventoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_inventory(self, page: int, page_size: int) -> InventoryListResponse:
        query = self.db.query(
            Inventory.product_id,
            Product.sku,
            Product.name.label("product_name"),
            Inventory.stock_quantity,
            Inventory.reserved_quantity,
            Inventory.low_stock_threshold
        ).join(Product, Inventory.product_id == Product.id)

        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        records = query.order_by(desc(Inventory.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        items = []
        for r in records:
            items.append(
                InventoryItemResponse(
                    product_id=r.product_id,
                    sku=r.sku,
                    product_name=r.product_name,
                    stock_quantity=r.stock_quantity,
                    reserved_quantity=r.reserved_quantity,
                    available_stock=r.stock_quantity - r.reserved_quantity,
                    low_stock_threshold=r.low_stock_threshold
                )
            )
            
        return InventoryListResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def update_inventory(self, product_id: int, payload: InventoryUpdate):
        inv = self.db.query(Inventory).filter(Inventory.product_id == product_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found for this product")

        if payload.stock_quantity is not None:
            inv.stock_quantity = payload.stock_quantity
        if payload.low_stock_threshold is not None:
            inv.low_stock_threshold = payload.low_stock_threshold
            
        self.db.add(inv)
        self.db.commit()
        self.db.refresh(inv)
        return inv
