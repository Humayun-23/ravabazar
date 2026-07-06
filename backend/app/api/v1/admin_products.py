from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_current_admin, get_db
from app.schemas.admin_products import AdminProductCreate, AdminProductUpdate
from app.schemas.products import ProductListResponse, ProductDetailPublic
from app.services.admin_products import AdminProductService

router = APIRouter()

@router.get("", response_model=ProductListResponse)
def list_admin_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_slug: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    sort: str = "newest",
    order: str = "desc",
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminProductService(db)
    return service.get_admin_products(
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

@router.get("/{id}", response_model=ProductDetailPublic)
def get_admin_product(
    id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminProductService(db)
    return service.get_product_detail(id)

@router.post("", response_model=ProductDetailPublic, status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: AdminProductCreate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminProductService(db)
    return service.create_product(payload)

@router.patch("/{id}", response_model=ProductDetailPublic)
def update_admin_product(
    id: int,
    payload: AdminProductUpdate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminProductService(db)
    return service.update_product(id, payload)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_product(
    id: int,
    response: Response,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminProductService(db)
    service.delete_product(id)
    response.status_code = status.HTTP_204_NO_CONTENT
    return None
