from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import re

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')
from typing import List

from app.repositories.categories import CategoryRepository
from app.schemas.admin_categories import AdminCategoryCreate, AdminCategoryUpdate
from app.schemas.categories import CategoryWithChildren

class AdminCategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)

    def get_admin_categories(self) -> List[CategoryWithChildren]:
        categories = self.repo.get_admin_categories()
        # Return only top-level categories, as children are nested
        top_level = [c for c in categories if c.parent_id is None]
        return [CategoryWithChildren.model_validate(c) for c in top_level]

    def get_category_detail(self, id: int) -> CategoryWithChildren:
        cat = self.repo.get_category_by_id(id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return CategoryWithChildren.model_validate(cat)

    def create_category(self, data: AdminCategoryCreate) -> CategoryWithChildren:
        slug = data.slug or slugify(data.name)
        
        # We don't have a check for slug uniqueness in repo, but it should be unique
        cat_data = data.model_dump()
        cat_data['slug'] = slug
        
        try:
            new_cat = self.repo.create_category(cat_data)
            return CategoryWithChildren.model_validate(new_cat)
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=409, detail=f"Database constraint error: {str(e.orig)}")

    def update_category(self, id: int, data: AdminCategoryUpdate) -> CategoryWithChildren:
        cat = self.repo.get_category_by_id(id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
            
        update_data = data.model_dump(exclude_unset=True)
        
        if 'parent_id' in update_data and update_data['parent_id'] == id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
            
        try:
            updated_cat = self.repo.update_category(cat, update_data)
            return CategoryWithChildren.model_validate(updated_cat)
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=409, detail=f"Database constraint error: {str(e.orig)}")
