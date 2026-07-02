from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BannerBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    image_url: str = Field(..., max_length=500)
    redirect_url: Optional[str] = Field(None, max_length=500)
    position: Optional[int] = 0
    is_active: Optional[bool] = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    image_url: Optional[str] = Field(None, max_length=500)
    redirect_url: Optional[str] = Field(None, max_length=500)
    position: Optional[int] = None
    is_active: Optional[bool] = None

class BannerInDBBase(BannerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Banner(BannerInDBBase):
    pass
