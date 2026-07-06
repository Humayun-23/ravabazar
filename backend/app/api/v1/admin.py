from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.schemas.auth import (
    AccessTokenResponse,
    AdminAuthResponse,
    AdminLoginRequest,
    RefreshTokenRequest,
)
from app.services.auth import AuthService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "admin"}


@router.post("/auth/login", response_model=AdminAuthResponse)
def login_admin(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    admin = service.authenticate_admin(payload)
    tokens = service.create_token_pair(subject_id=admin.id, subject_type="admin")
    return {**tokens, "admin": admin}


@router.post("/auth/refresh", response_model=AccessTokenResponse)
def refresh_admin_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return AuthService(db).refresh_access_token(
        refresh_token=payload.refresh_token,
        subject_type="admin",
    )


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_admin(
    response: Response,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    AuthService(db).logout_subject(
        subject_type="admin",
        subject_id=current_admin.id,
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return None
