from typing import List
from sqlalchemy.orm import Session
from app.repositories.banners import BannerRepository
from app.schemas.banners import Banner

class BannerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BannerRepository(db)

    def get_banners(self) -> List[Banner]:
        items = self.repo.get_public_banners()
        return [Banner.model_validate(item) for item in items]
