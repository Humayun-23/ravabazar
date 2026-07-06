from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.models.admins import Admin
from app.schemas.inventory import Inventory, InventoryUpdate
from app.schemas.admin_inventory import InventoryListResponse
from app.services.admin_inventory import AdminInventoryService

router = APIRouter()

@router.get("", response_model=InventoryListResponse)
def list_inventory(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminInventoryService(db)
    return service.list_inventory(page=page, page_size=page_size)

@router.patch("/{product_id}", response_model=Inventory)
def update_inventory(
    product_id: int,
    payload: InventoryUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminInventoryService(db)
    # The API contract implies we return the inventory row itself
    inv = service.update_inventory(product_id, payload)
    return inv
