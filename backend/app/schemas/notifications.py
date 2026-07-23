from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DeviceTokenCreate(BaseModel):
    token: str
    device_type: Optional[str] = None

class DeviceTokenResponse(BaseModel):
    id: int
    token: str
    device_type: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    type: Optional[str] = None
    related_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
