from pydantic import BaseModel
from typing import List
from app.schemas.users import User

class UserListResponse(BaseModel):
    items: List[User] = []
    page: int
    page_size: int
    total: int
    total_pages: int
