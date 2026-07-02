from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db

router = APIRouter()


def build_health_response(db: Session) -> dict[str, str]:
    database_status = "ok"

    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        database_status = f"error: {exc}"

    return {
        "status": "ok" if database_status == "ok" else "degraded",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": database_status,
    }


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    return build_health_response(db)
