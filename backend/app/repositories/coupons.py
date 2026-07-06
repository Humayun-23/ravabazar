from typing import Optional
from sqlalchemy.orm import Session
from app.models.coupons import Coupon

class CouponRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_code(self, code: str) -> Optional[Coupon]:
        return self.db.query(Coupon).filter(Coupon.code == code).first()

    def get_by_id(self, coupon_id: int) -> Optional[Coupon]:
        return self.db.query(Coupon).filter(Coupon.id == coupon_id).first()

    def list_all(
        self,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[Coupon], int]:
        query = self.db.query(Coupon)
        total = query.count()
        coupons = (
            query.order_by(Coupon.created_at.desc(), Coupon.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return coupons, total

    def create(self, coupon_data: dict) -> Coupon:
        coupon = Coupon(**coupon_data)
        self.db.add(coupon)
        self.db.flush()
        self.db.refresh(coupon)
        return coupon

    def update(self, coupon: Coupon, update_data: dict) -> Coupon:
        for key, value in update_data.items():
            setattr(coupon, key, value)
        self.db.add(coupon)
        self.db.flush()
        self.db.refresh(coupon)
        return coupon
