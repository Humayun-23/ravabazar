import math
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import re

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

from app.repositories.products import ProductRepository
from app.schemas.admin_products import AdminProductCreate, AdminProductUpdate
from app.schemas.products import ProductListResponse, ProductDetailPublic
from app.services.products import ProductService

class AdminProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)
        self.public_service = ProductService(db)

    def get_admin_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort: str = "newest",
        order: str = "desc"
    ) -> ProductListResponse:
        
        items_orm, total = self.repo.get_admin_products(
            page=page,
            page_size=page_size,
            search=search,
            category_slug=category_slug,
            min_price=min_price,
            max_price=max_price,
            is_featured=is_featured,
            sort_by=sort,
            sort_order=order
        )

        items_pydantic = []
        for item in items_orm:
            # Re-using the formatting logic from the public service for consistency
            product_public = self.public_service._format_product_public(item)
            items_pydantic.append(product_public)

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return ProductListResponse(
            items=items_pydantic,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def get_product_detail(self, id: int) -> ProductDetailPublic:
        item = self.repo.get_product_by_id_admin(id)
        if not item:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return self.public_service._format_product_detail(item)

    def create_product(self, data: AdminProductCreate) -> ProductDetailPublic:
        slug = data.slug or slugify(data.name)
        
        # Check uniqueness
        if self.repo.get_product_by_slug_admin(slug):
            raise HTTPException(status_code=409, detail="Product slug already exists")
            
        product_data = data.model_dump(exclude={'inventory', 'images'})
        product_data['slug'] = slug
        
        inventory_data = data.inventory.model_dump()
        images_data = [img.model_dump() for img in data.images]
        
        try:
            new_product = self.repo.create_product(product_data, inventory_data, images_data)
            return self.public_service._format_product_detail(new_product)
        except IntegrityError as e:
            # e.g., SKU unique constraint failure
            self.db.rollback()
            raise HTTPException(status_code=409, detail=f"Database constraint error: {str(e.orig)}")

    def update_product(self, id: int, data: AdminProductUpdate) -> ProductDetailPublic:
        product = self.repo.get_product_by_id_admin(id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = data.model_dump(exclude_unset=True, exclude={'inventory', 'images'})
        if 'slug' in update_data and update_data['slug']:
            existing = self.repo.get_product_by_slug_admin(update_data['slug'])
            if existing and existing.id != id:
                raise HTTPException(status_code=409, detail="Product slug already exists")

        inventory_data = data.inventory.model_dump(exclude_unset=True) if data.inventory else None
        images_data = [img.model_dump() for img in data.images] if data.images is not None else None
        
        try:
            updated_product = self.repo.update_product(product, update_data, inventory_data, images_data)
            return self.public_service._format_product_detail(updated_product)
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=409, detail=f"Database constraint error: {str(e.orig)}")

    def delete_product(self, id: int):
        product = self.repo.get_product_by_id_admin(id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        try:
            self.repo.delete_product(product)
        except IntegrityError as e:
            # If constrained by orders, deactivate instead of hard delete
            self.db.rollback()
            product = self.repo.get_product_by_id_admin(id)
            from app.models.products import ProductStatus
            self.repo.update_product(product, {"status": ProductStatus.inactive})
