from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Ravabazar API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ravabazar"

    JWT_SECRET: str = "change_this_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    GOOGLE_CLIENT_ID: str = ""

    PAYMENT_CURRENCY: str = "INR"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_WEBHOOK_SECRET: str = ""

    COURIER_PROVIDER: str = "manual"
    SHIPROCKET_BASE_URL: str = "https://apiv2.shiprocket.in/v1/external"
    SHIPROCKET_EMAIL: str = ""
    SHIPROCKET_PASSWORD: str = ""
    SHIPROCKET_PICKUP_LOCATION: str = ""
    SHIPROCKET_WEBHOOK_SECRET: str = ""
    SHIPROCKET_DEFAULT_LENGTH_CM: float = 10.0
    SHIPROCKET_DEFAULT_BREADTH_CM: float = 10.0
    SHIPROCKET_DEFAULT_HEIGHT_CM: float = 5.0
    SHIPROCKET_DEFAULT_WEIGHT_KG: float = 0.5

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@ravabazar.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "sandbox.smtp.mailtrap.io"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    
    MAILTRAP_API_TOKEN: str = ""
    FIREBASE_CREDENTIALS: str = ""

    ENABLE_MOBILE_OTP_VERIFICATION: bool = False
    SMS_PROVIDER_ACCOUNT_ID: str = ""
    SMS_PROVIDER_AUTH_TOKEN: str = ""
    SMS_PROVIDER_SENDER_ID: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.is_production:
            if self.JWT_SECRET in {"", "change_this_secret"}:
                raise ValueError("JWT_SECRET must be set in production")
            
            origins = self.cors_origins_list
            if not origins:
                raise ValueError("CORS_ORIGINS cannot be empty in production")
            if "*" in origins:
                raise ValueError("Wildcard CORS is not allowed in production")
            for origin in origins:
                if "localhost" in origin or "127.0.0.1" in origin:
                    raise ValueError(f"Localhost origin '{origin}' is not allowed in production")
                    
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
