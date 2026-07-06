from pydantic import BaseModel, Field
from typing import Optional

class AdminOrderStatusUpdate(BaseModel):
    status: str = Field(..., max_length=50)
    note: Optional[str] = Field(None, max_length=500)
