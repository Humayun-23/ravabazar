from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.categories import CategoryWithChildren
from app.schemas.products import ProductListResponse
from app.services.categories import CategoryService
from app.services.products import ProductService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "categories"}

@router.get("/", response_model=List[CategoryWithChildren])
def get_categories(db: Session = Depends(get_db)):
    service = CategoryService(db)
    return service.get_categories()

@router.get("/{slug}/products", response_model=ProductListResponse)
def get_category_products(
    slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
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
        category_slug=slug,
        min_price=min_price,
        max_price=max_price,
        is_featured=is_featured,
        sort=sort,
        order=order
    )
