from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.admin_coupons import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponListResponse
)
from app.services.admin_coupons import AdminCouponService

router = APIRouter()

@router.get("", response_model=CouponListResponse)
def list_coupons(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminCouponService(db).list_coupons(page=page, page_size=page_size)

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    payload: CouponCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminCouponService(db).create_coupon(payload)

@router.get("/{coupon_id}", response_model=CouponResponse)
def get_coupon(
    coupon_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminCouponService(db).get_coupon(coupon_id)

@router.patch("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminCouponService(db).update_coupon(coupon_id, payload)
