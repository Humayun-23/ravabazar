from typing import List
from sqlalchemy.orm import Session
from app.models.settings import Setting

class SettingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Setting]:
        return self.db.query(Setting).all()

    def get_by_key(self, key: str) -> Setting | None:
        return self.db.query(Setting).filter(Setting.key == key).first()

    def create(self, setting_data: dict) -> Setting:
        setting = Setting(**setting_data)
        self.db.add(setting)
        self.db.flush()
        self.db.refresh(setting)
        return setting

    def update(self, setting: Setting, update_data: dict) -> Setting:
        for key, value in update_data.items():
            setattr(setting, key, value)
        self.db.add(setting)
        self.db.flush()
        self.db.refresh(setting)
        return setting

    def delete(self, setting: Setting) -> None:
        self.db.delete(setting)
        self.db.flush()
