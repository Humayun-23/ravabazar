from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.repositories.settings import SettingRepository
from app.schemas.settings import SettingCreate, SettingUpdate, Setting

class AdminSettingService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SettingRepository(db)

    def list_all(self) -> List[Setting]:
        return self.repo.get_all()

    def get_setting(self, key: str) -> Setting:
        setting = self.repo.get_by_key(key)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found."
            )
        return setting

    def create_setting(self, payload: SettingCreate) -> Setting:
        existing = self.repo.get_by_key(payload.key)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Setting key already exists."
            )
        setting = self.repo.create(payload.model_dump())
        self.db.commit()
        self.db.refresh(setting)
        return setting

    def update_setting(self, key: str, payload: SettingUpdate) -> Setting:
        setting = self.get_setting(key)
        update_data = payload.model_dump(exclude_unset=True)
        setting = self.repo.update(setting, update_data)
        self.db.commit()
        self.db.refresh(setting)
        return setting

    def delete_setting(self, key: str) -> dict:
        setting = self.get_setting(key)
        self.repo.delete(setting)
        self.db.commit()
        return {"detail": "Setting deleted successfully"}
