from typing import List
from sqlalchemy.orm import Session, joinedload
from app.models.categories import Category

class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_public_categories(self) -> List[Category]:
        return self.db.query(Category).filter(
            Category.is_active == True,
            Category.parent_id == None
        ).options(
            joinedload(Category.children)
        ).all()
