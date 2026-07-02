from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SettingBase(BaseModel):
    key: str = Field(..., max_length=255)
    value: str
    description: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None

class SettingInDBBase(SettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Setting(SettingInDBBase):
    pass
