import json
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notifications import Notification
from app.models.device_tokens import DeviceToken
from app.core.config import settings

logger = logging.getLogger(__name__)

# Attempt to import firebase-admin
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    
    if settings.FIREBASE_CREDENTIALS:
        try:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            logger.info("Firebase Admin initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin with credentials: {e}")
            firebase_initialized = False
    else:
        logger.warning("FIREBASE_CREDENTIALS not set in environment. Push notifications will be disabled.")
        firebase_initialized = False

except ImportError:
    logger.warning("firebase-admin package not found. Push notifications will be disabled.")
    firebase_initialized = False


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def register_device_token(self, user_id: int, token: str, device_type: Optional[str] = None):
        # Check if token exists
        existing = self.db.query(DeviceToken).filter(DeviceToken.token == token).first()
        if existing:
            if existing.user_id != user_id:
                # Token moved to another user (e.g. logged out and someone else logged in)
                existing.user_id = user_id
                self.db.commit()
            return existing
        
        # Create new
        new_token = DeviceToken(user_id=user_id, token=token, device_type=device_type)
        self.db.add(new_token)
        self.db.commit()
        self.db.refresh(new_token)
        return new_token

    def remove_device_token(self, token: str):
        existing = self.db.query(DeviceToken).filter(DeviceToken.token == token).first()
        if existing:
            self.db.delete(existing)
            self.db.commit()

    def get_user_notifications(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Notification]:
        return self.db.query(Notification).filter(Notification.user_id == user_id)\
                      .order_by(Notification.created_at.desc())\
                      .offset(skip).limit(limit).all()

    def mark_as_read(self, user_id: int, notification_id: int):
        notif = self.db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
        if notif:
            notif.is_read = True
            self.db.commit()
            return notif
        return None

    def send_push_notification(self, user_id: int, title: str, body: str, notification_type: str = None, related_id: int = None):
        # 1. Save to database
        db_notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            type=notification_type,
            related_id=related_id
        )
        self.db.add(db_notif)
        self.db.commit()
        self.db.refresh(db_notif)

        # 2. Send via Firebase
        if not firebase_initialized:
            logger.warning("Firebase not initialized. Notification saved to DB but not pushed.")
            return db_notif

        tokens = self.db.query(DeviceToken.token).filter(DeviceToken.user_id == user_id).all()
        token_list = [t[0] for t in tokens]

        if not token_list:
            return db_notif

        # FCM Message
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data={
                "type": notification_type or "",
                "related_id": str(related_id) if related_id else "",
                "notification_id": str(db_notif.id)
            },
            tokens=token_list,
        )

        try:
            response = messaging.send_multicast(message)
            logger.info(f"Successfully sent {response.success_count} messages; failed {response.failure_count}")
            # Could clean up invalid tokens here if we parse response.responses
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")

        return db_notif
