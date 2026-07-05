from datetime import datetime, timedelta
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_token(
    *,
    subject_id: int,
    subject_type: str,
    token_type: str,
    expires_delta: timedelta,
) -> tuple[str, str, datetime]:
    expires_at = datetime.utcnow() + expires_delta
    jti = str(uuid4())
    payload = {
        "sub": str(subject_id),
        "subject_type": subject_type,
        "type": token_type,
        "jti": jti,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def create_access_token(subject_id: int, subject_type: str) -> tuple[str, str, datetime]:
    return create_token(
        subject_id=subject_id,
        subject_type=subject_type,
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject_id: int, subject_type: str) -> tuple[str, str, datetime]:
    return create_token(
        subject_id=subject_id,
        subject_type=subject_type,
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
