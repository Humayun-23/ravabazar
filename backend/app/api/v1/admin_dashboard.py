from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.admin_dashboard import DashboardResponse
from app.services.admin_dashboard import AdminDashboardService

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return AdminDashboardService(db).get_dashboard_metrics()
