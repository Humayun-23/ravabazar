from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.users import User
from app.schemas.admin_users import UserListResponse
from app.services.admin_users import AdminUserService

router = APIRouter()


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Search by name, email, or phone"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).list_users(
        page=page,
        page_size=page_size,
        search=search,
    )


@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminUserService(db).get_user(user_id=user_id)
