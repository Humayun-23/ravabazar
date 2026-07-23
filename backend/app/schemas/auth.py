from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.schemas.admins import Admin
from app.schemas.users import User


class GoogleLoginRequest(BaseModel):
    token: str
    phone: Optional[str] = Field(None, max_length=20)


class CustomerLoginRequest(BaseModel):
    phone: str = Field(..., max_length=20)
    password: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RequestOTPRequest(BaseModel):
    phone: str = Field(..., max_length=20)


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., max_length=20)
    otp: str = Field(..., min_length=4, max_length=10)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CustomerAuthResponse(AccessTokenResponse):
    refresh_token: str
    user: User


class AdminAuthResponse(AccessTokenResponse):
    refresh_token: str
    admin: Admin
