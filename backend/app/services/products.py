import math
from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.products import ProductRepository
from app.schemas.products import ProductListResponse, ProductPublic, ProductDetailPublic
from app.schemas.categories import CategoryBasic
from app.schemas.product_images import ProductImageBasic
from fastapi import HTTPException

class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def get_public_products(
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
        
        items_orm, total = self.repo.get_public_products(
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
            # Find primary image
            primary_image = None
            for img in item.images:
                if img.is_primary:
                    primary_image = ProductImageBasic.model_validate(img)
                    break
            if not primary_image and item.images:
                primary_image = ProductImageBasic.model_validate(item.images[0])
            
            # Format category
            category = None
            if item.category:
                category = CategoryBasic.model_validate(item.category)
            
            # Stock
            available_stock = item.inventory.available_stock if item.inventory else 0

            product_public = ProductPublic(
                id=item.id,
                name=item.name,
                slug=item.slug,
                sku=item.sku,
                description=item.description,
                price=item.price,
                sale_price=item.sale_price,
                status=item.status,
                is_featured=item.is_featured,
                category=category,
                primary_image=primary_image,
                available_stock=available_stock
            )
            items_pydantic.append(product_public)

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return ProductListResponse(
            items=items_pydantic,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def get_product_detail(self, slug: str) -> ProductDetailPublic:
        item = self.repo.get_product_by_slug(slug)
        if not item:
            raise HTTPException(status_code=404, detail="Product not found or inactive")
        
        # Format images
        images = [ProductImageBasic.model_validate(img) for img in item.images]

        # Format category
        category = None
        if item.category:
            category = CategoryBasic.model_validate(item.category)
        
        # Stock
        available_stock = item.inventory.available_stock if item.inventory else 0

        return ProductDetailPublic(
            id=item.id,
            name=item.name,
            slug=item.slug,
            sku=item.sku,
            description=item.description,
            price=item.price,
            sale_price=item.sale_price,
            status=item.status,
            is_featured=item.is_featured,
            category=category,
            images=images,
            available_stock=available_stock,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
