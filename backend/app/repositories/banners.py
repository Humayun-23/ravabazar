from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import asc
from app.models.banners import Banner

class BannerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_public_banners(self) -> List[Banner]:
        return self.db.query(Banner).filter(
            Banner.is_active == True
        ).order_by(asc(Banner.position)).all()

    def get_all(self) -> List[Banner]:
        return self.db.query(Banner).order_by(asc(Banner.position)).all()

    def get_by_id(self, banner_id: int) -> Banner | None:
        return self.db.query(Banner).filter(Banner.id == banner_id).first()

    def create(self, banner_data: dict) -> Banner:
        banner = Banner(**banner_data)
        self.db.add(banner)
        self.db.flush()
        self.db.refresh(banner)
        return banner

    def update(self, banner: Banner, update_data: dict) -> Banner:
        for key, value in update_data.items():
            setattr(banner, key, value)
        self.db.add(banner)
        self.db.flush()
        self.db.refresh(banner)
        return banner

    def delete(self, banner: Banner) -> None:
        self.db.delete(banner)
        self.db.flush()
