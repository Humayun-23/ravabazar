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
