import math
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.users import UserRepository
from app.schemas.admin_users import UserListResponse
from app.schemas.users import User

class AdminUserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def list_users(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
    ) -> UserListResponse:
        users, total = self.repo.list_all(
            page=page,
            page_size=page_size,
            search=search,
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return UserListResponse(
            items=users,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    def get_user(self, user_id: int) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user
