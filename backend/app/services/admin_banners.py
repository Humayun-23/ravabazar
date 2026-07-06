from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.repositories.banners import BannerRepository
from app.schemas.banners import BannerCreate, BannerUpdate, Banner

class AdminBannerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BannerRepository(db)

    def list_all(self) -> List[Banner]:
        return self.repo.get_all()

    def get_banner(self, banner_id: int) -> Banner:
        banner = self.repo.get_by_id(banner_id)
        if not banner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Banner not found."
            )
        return banner

    def create_banner(self, payload: BannerCreate) -> Banner:
        banner = self.repo.create(payload.model_dump())
        self.db.commit()
        self.db.refresh(banner)
        return banner

    def update_banner(self, banner_id: int, payload: BannerUpdate) -> Banner:
        banner = self.get_banner(banner_id)
        update_data = payload.model_dump(exclude_unset=True)
        banner = self.repo.update(banner, update_data)
        self.db.commit()
        self.db.refresh(banner)
        return banner

    def delete_banner(self, banner_id: int) -> dict:
        banner = self.get_banner(banner_id)
        self.repo.delete(banner)
        self.db.commit()
        return {"detail": "Banner deleted successfully"}
