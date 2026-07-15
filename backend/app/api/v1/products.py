from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.products import ProductListResponse, ProductDetailPublic
from app.services.products import ProductService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "products"}

@router.get("/", response_model=ProductListResponse)
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_slug: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    sort: str = "newest",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    service = ProductService(db)
    return service.get_public_products(
        page=page,
        page_size=page_size,
        search=search,
        category_slug=category_slug,
        min_price=min_price,
        max_price=max_price,
        is_featured=is_featured,
        sort=sort,
        order=order
    )


@router.get("/{slug}", response_model=ProductDetailPublic)
def get_product(slug: str, db: Session = Depends(get_db)):
    service = ProductService(db)
    return service.get_product_detail(slug=slug)