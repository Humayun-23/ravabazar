from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin, get_db
from app.schemas.admin_categories import AdminCategoryCreate, AdminCategoryUpdate
from app.schemas.categories import CategoryWithChildren
from app.services.admin_categories import AdminCategoryService

router = APIRouter()

@router.get("", response_model=List[CategoryWithChildren])
def list_admin_categories(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminCategoryService(db)
    return service.get_admin_categories()

@router.get("/{id}", response_model=CategoryWithChildren)
def get_admin_category(
    id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminCategoryService(db)
    return service.get_category_detail(id)

@router.post("", response_model=CategoryWithChildren, status_code=status.HTTP_201_CREATED)
def create_admin_category(
    payload: AdminCategoryCreate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminCategoryService(db)
    return service.create_category(payload)

@router.patch("/{id}", response_model=CategoryWithChildren)
def update_admin_category(
    id: int,
    payload: AdminCategoryUpdate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminCategoryService(db)
    return service.update_category(id, payload)
