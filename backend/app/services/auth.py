from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests

import app.models  # noqa: F401
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.admins import Admin
from app.models.users import User
from app.repositories.admins import AdminRepository
from app.repositories.refresh_tokens import RefreshTokenRepository
from app.repositories.users import UserRepository
from app.schemas.admins import AdminCreate
from app.schemas.auth import AdminLoginRequest, CustomerLoginRequest, GoogleLoginRequest
from app.schemas.users import UserCreate


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.admins = AdminRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)

    def register_customer(self, payload: UserCreate, background_tasks=None) -> User:
        if self.users.get_by_phone(payload.phone):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this phone already exists.",
            )

        verification_token = str(uuid.uuid4())

        user = self.users.create(
            phone=payload.phone,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
        )
        user.verification_token = verification_token
        user.is_email_verified = False
        
        self.db.commit()
        self.db.refresh(user)
        
        if payload.email and background_tasks:
            from app.services.email import EmailService
            background_tasks.add_task(
                EmailService.send_verification_email,
                email=payload.email,
                token=verification_token,
                first_name=payload.first_name or "Customer"
            )
            
        return user

    def authenticate_customer(self, payload: CustomerLoginRequest) -> User:
        user = self.users.get_by_phone(payload.phone)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone or password.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer account is inactive.",
            )
        return user

    def request_otp(self, phone: str) -> bool:
        if not settings.ENABLE_MOBILE_OTP_VERIFICATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP verification is currently disabled.",
            )
            
        import random
        from datetime import datetime, timedelta
        from app.models.otp import OTPVerification
        from app.services.sms import SmsService
        
        # Invalidate old OTPs for this phone
        self.db.query(OTPVerification).filter(
            OTPVerification.phone == phone,
            OTPVerification.is_used == False
        ).update({"is_used": True})
        
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        otp_record = OTPVerification(
            phone=phone,
            otp_code=otp_code,
            expires_at=expires_at
        )
        self.db.add(otp_record)
        self.db.commit()
        
        return SmsService.send_otp(phone, otp_code)

    def verify_otp_login(self, phone: str, otp: str) -> User:
        if not settings.ENABLE_MOBILE_OTP_VERIFICATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP verification is currently disabled.",
            )
            
        from datetime import datetime
        from app.models.otp import OTPVerification
        
        otp_record = self.db.query(OTPVerification).filter(
            OTPVerification.phone == phone,
            OTPVerification.otp_code == otp,
            OTPVerification.is_used == False,
            OTPVerification.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP.",
            )
            
        otp_record.is_used = True
        
        user = self.users.get_by_phone(phone)
        if not user:
            # Auto-signup
            user = self.users.create(
                phone=phone,
                email=None,
                hashed_password=None,
                first_name="Customer",
                last_name="",
            )
            user.is_email_verified = False
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer account is inactive.",
            )
            
        self.db.commit()
        return user

    def authenticate_google(self, payload: GoogleLoginRequest) -> User:
        try:
            idinfo = id_token.verify_oauth2_token(
                payload.token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = idinfo.get("email")
            google_id = idinfo.get("sub")
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
        except ValueError as e:
            print(f"Google Token Verification Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token.",
            )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token does not contain an email.",
            )

        user = self.db.query(User).filter(User.email == email).first()

        if user:
            if not user.google_id:
                user.google_id = google_id
                self.db.commit()
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Customer account is inactive.",
                )
            return user
        
        if not payload.phone:
            raise HTTPException(
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
                detail="Phone number is required to complete registration.",
            )

        existing_phone = self.users.get_by_phone(payload.phone)
        if existing_phone:
            if not existing_phone.google_id:
                existing_phone.google_id = google_id
                if not existing_phone.email:
                    existing_phone.email = email
                self.db.commit()
                return existing_phone
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This phone number is already associated with another account.",
                )

        user = self.users.create(
            phone=payload.phone,
            email=email,
            hashed_password=None,
            first_name=first_name,
            last_name=last_name,
        )
        user.google_id = google_id
        user.is_email_verified = True
        self.db.commit()
        self.db.refresh(user)

        return user

    def verify_email(self, token: str) -> bool:
        user = self.db.query(User).filter(User.verification_token == token).first()
        if not user:
            return False
        user.is_email_verified = True
        user.verification_token = None
        self.db.commit()
        return True

    def authenticate_admin(self, payload: AdminLoginRequest) -> Admin:
        admin = self.admins.get_by_email(payload.email)
        if not admin or not verify_password(payload.password, admin.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is inactive.",
            )
        return admin

    def create_token_pair(self, *, subject_id: int, subject_type: str) -> dict:
        access_token, _, _ = create_access_token(subject_id, subject_type)
        refresh_token, refresh_jti, refresh_expires_at = create_refresh_token(
            subject_id,
            subject_type,
        )
        self.refresh_tokens.create(
            jti=refresh_jti,
            subject_type=subject_type,
            subject_id=subject_id,
            expires_at=refresh_expires_at,
        )
        self.db.commit()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    def refresh_access_token(self, *, refresh_token: str, subject_type: str) -> dict:
        claims = decode_token(refresh_token)
        if not claims:
            raise self._invalid_refresh_token()

        if claims.get("type") != "refresh" or claims.get("subject_type") != subject_type:
            raise self._invalid_refresh_token()

        try:
            subject_id = int(claims["sub"])
        except (KeyError, TypeError, ValueError):
            raise self._invalid_refresh_token()

        token_record = self.refresh_tokens.get_active(
            jti=claims.get("jti", ""),
            subject_type=subject_type,
        )
        if not token_record or token_record.subject_id != subject_id:
            raise self._invalid_refresh_token()

        if subject_type == "customer":
            subject = self.users.get_by_id(subject_id)
            inactive_message = "Customer account is inactive."
        else:
            subject = self.admins.get_by_id(subject_id)
            inactive_message = "Admin account is inactive."

        if not subject or not subject.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=inactive_message,
            )

        access_token, _, _ = create_access_token(subject_id, subject_type)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    def logout_subject(self, *, subject_type: str, subject_id: int) -> None:
        self.refresh_tokens.revoke_active_for_subject(
            subject_type=subject_type,
            subject_id=subject_id,
        )
        self.db.commit()

    @staticmethod
    def _invalid_refresh_token() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )
