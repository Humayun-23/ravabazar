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

    def get_admin_categories(self) -> List[Category]:
        return self.db.query(Category).options(
            joinedload(Category.children)
        ).all()
        
    def get_category_by_id(self, category_id: int) -> Category:
        return self.db.query(Category).filter(Category.id == category_id).first()
        
    def create_category(self, category_data: dict) -> Category:
        category = Category(**category_data)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
        
    def update_category(self, category: Category, update_data: dict) -> Category:
        for key, value in update_data.items():
            setattr(category, key, value)
        self.db.commit()
        self.db.refresh(category)
        return category
