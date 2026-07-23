from fastapi import APIRouter, Depends, Response, status, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.schemas.auth import (
    AccessTokenResponse,
    CustomerAuthResponse,
    CustomerLoginRequest,
    GoogleLoginRequest,
    RefreshTokenRequest,
    RequestOTPRequest,
    VerifyOTPRequest,
)
from app.schemas.users import User, UserCreate
from app.services.auth import AuthService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "auth"}


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register_customer(payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return AuthService(db).register_customer(payload, background_tasks)


@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    service = AuthService(db)
    success = service.verify_email(token)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=CustomerAuthResponse)
def login_customer(payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate_customer(payload)
    tokens = service.create_token_pair(subject_id=user.id, subject_type="customer")
    return {**tokens, "user": user}


@router.post("/google", response_model=CustomerAuthResponse)
def login_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate_google(payload)
    tokens = service.create_token_pair(subject_id=user.id, subject_type="customer")
    return {**tokens, "user": user}
@router.post("/request-otp")
def request_otp(payload: RequestOTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    success = service.request_otp(payload.phone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please try again.")
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp", response_model=CustomerAuthResponse)
def verify_otp_login(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.verify_otp_login(payload.phone, payload.otp)
    tokens = service.create_token_pair(subject_id=user.id, subject_type="customer")
    return {**tokens, "user": user}




@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_customer_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return AuthService(db).refresh_access_token(
        refresh_token=payload.refresh_token,
        subject_type="customer",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_customer(
    response: Response,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService(db).logout_subject(
        subject_type="customer",
        subject_id=current_user.id,
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return None


@router.get("/me", response_model=User)
def get_me(current_user=Depends(get_current_user)):
    return current_user
