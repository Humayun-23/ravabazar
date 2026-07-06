from typing import List
from sqlalchemy.orm import Session
from app.repositories.categories import CategoryRepository
from app.schemas.categories import CategoryWithChildren

class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)

    def get_categories(self) -> List[CategoryWithChildren]:
        items = self.repo.get_public_categories()
        # Filter active children only
        result = []
        for item in items:
            cat_pydantic = CategoryWithChildren.model_validate(item)
            cat_pydantic.children = [child for child in cat_pydantic.children if child.is_active]
            result.append(cat_pydantic)
        return result
