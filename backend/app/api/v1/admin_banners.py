from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.banners import BannerCreate, BannerUpdate, Banner
from app.services.admin_banners import AdminBannerService

router = APIRouter()

@router.get("", response_model=List[Banner])
def list_banners(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminBannerService(db).list_all()

@router.post("", response_model=Banner, status_code=status.HTTP_201_CREATED)
def create_banner(
    payload: BannerCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminBannerService(db).create_banner(payload)

@router.get("/{banner_id}", response_model=Banner)
def get_banner(
    banner_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminBannerService(db).get_banner(banner_id)

@router.patch("/{banner_id}", response_model=Banner)
def update_banner(
    banner_id: int,
    payload: BannerUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminBannerService(db).update_banner(banner_id, payload)

@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminBannerService(db).delete_banner(banner_id)
