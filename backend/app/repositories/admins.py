from sqlalchemy.orm import Session

from app.models.admins import Admin


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, admin_id: int) -> Admin | None:
        return self.db.query(Admin).filter(Admin.id == admin_id).first()

    def get_by_email(self, email: str) -> Admin | None:
        return self.db.query(Admin).filter(Admin.email == email).first()
