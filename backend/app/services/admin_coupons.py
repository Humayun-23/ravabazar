import math
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.coupons import CouponRepository
from app.schemas.admin_coupons import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponListResponse
)

class AdminCouponService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CouponRepository(db)

    def list_coupons(self, page: int, page_size: int) -> CouponListResponse:
        coupons, total = self.repo.list_all(page=page, page_size=page_size)
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return CouponListResponse(
            items=coupons,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    def get_coupon(self, coupon_id: int) -> CouponResponse:
        coupon = self.repo.get_by_id(coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found."
            )
        return coupon

    def create_coupon(self, payload: CouponCreate) -> CouponResponse:
        existing = self.repo.get_by_code(payload.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Coupon code already exists."
            )
        
        if payload.discount_type not in ["fixed", "percentage"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount type must be 'fixed' or 'percentage'."
            )
            
        if payload.discount_type == "percentage" and payload.discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage discount cannot exceed 100."
            )

        coupon = self.repo.create(payload.model_dump())
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def update_coupon(self, coupon_id: int, payload: CouponUpdate) -> CouponResponse:
        coupon = self.repo.get_by_id(coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found."
            )

        update_data = payload.model_dump(exclude_unset=True)
        
        if "code" in update_data and update_data["code"] != coupon.code:
            existing = self.repo.get_by_code(update_data["code"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Coupon code already exists."
                )

        if "discount_type" in update_data and update_data["discount_type"] not in ["fixed", "percentage"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount type must be 'fixed' or 'percentage'."
            )
            
        final_discount_type = update_data.get("discount_type", coupon.discount_type)
        final_discount_value = update_data.get("discount_value", coupon.discount_value)
        
        if final_discount_type == "percentage" and final_discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage discount cannot exceed 100."
            )

        coupon = self.repo.update(coupon, update_data)
        self.db.commit()
        self.db.refresh(coupon)
        return coupon
