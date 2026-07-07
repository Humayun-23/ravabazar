from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_db
from app.repositories.coupons import CouponRepository
from app.schemas.coupons import CouponValidateRequest, CouponValidateResponse

router = APIRouter()

@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db)
):
    repo = CouponRepository(db)
    coupon = repo.get_by_code(payload.code.strip().upper())
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found."
        )
        
    if not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon is not active."
        )
        
    now = datetime.utcnow()
    if coupon.valid_from and now < coupon.valid_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon is not valid yet."
        )
        
    if coupon.valid_until and now > coupon.valid_until:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon has expired."
        )
        
    if coupon.usage_limit > 0 and coupon.usage_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon usage limit reached."
        )

    return CouponValidateResponse(
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        min_order_value=coupon.min_order_value
    )
