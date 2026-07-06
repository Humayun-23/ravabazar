from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.settings import SettingCreate, SettingUpdate, Setting
from app.services.admin_settings import AdminSettingService

router = APIRouter()

@router.get("", response_model=List[Setting])
def list_settings(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingService(db).list_all()

@router.post("", response_model=Setting, status_code=status.HTTP_201_CREATED)
def create_setting(
    payload: SettingCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingService(db).create_setting(payload)

@router.get("/{key}", response_model=Setting)
def get_setting(
    key: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingService(db).get_setting(key)

@router.patch("/{key}", response_model=Setting)
def update_setting(
    key: str,
    payload: SettingUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingService(db).update_setting(key, payload)

@router.delete("/{key}")
def delete_setting(
    key: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingService(db).delete_setting(key)
