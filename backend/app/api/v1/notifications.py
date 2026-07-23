from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.users import User
from app.schemas.notifications import DeviceTokenCreate, DeviceTokenResponse, NotificationResponse
from app.services.notification_service import NotificationService
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])

class SuccessResponse(BaseModel):
    success: bool
    message: str

@router.post("/register-device", response_model=DeviceTokenResponse)
def register_device(
    data: DeviceTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a device token for push notifications.
    """
    service = NotificationService(db)
    return service.register_device_token(current_user.id, data.token, data.device_type)

@router.delete("/remove-device")
def remove_device(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # ensure user is logged in
):
    """
    Remove a device token (e.g. on logout).
    """
    service = NotificationService(db)
    service.remove_device_token(token)
    return SuccessResponse(success=True, message="Token removed")

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's notifications.
    """
    service = NotificationService(db)
    return service.get_user_notifications(current_user.id, skip=skip, limit=limit)

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    service = NotificationService(db)
    notif = service.mark_as_read(current_user.id, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif
