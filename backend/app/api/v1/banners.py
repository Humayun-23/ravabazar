from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.banners import Banner
from app.services.banners import BannerService

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "banners"}

@router.get("/", response_model=List[Banner])
def get_banners(db: Session = Depends(get_db)):
    service = BannerService(db)
    return service.get_banners()
