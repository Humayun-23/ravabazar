from fastapi import HTTPException, status
from sqlalchemy.orm import Session

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
from app.schemas.auth import AdminLoginRequest, CustomerLoginRequest
from app.schemas.users import UserCreate


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.admins = AdminRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)

    def register_customer(self, payload: UserCreate) -> User:
        if self.users.get_by_phone(payload.phone):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this phone already exists.",
            )

        user = self.users.create(
            phone=payload.phone,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
        )
        self.db.commit()
        self.db.refresh(user)
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
