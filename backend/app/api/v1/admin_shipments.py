from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_db
from app.schemas.shipments import Shipment, ShipmentCreate, ShipmentUpdate
from app.services.admin_shipments import AdminShipmentService

router = APIRouter()

@router.post("", response_model=Shipment, status_code=status.HTTP_201_CREATED)
def create_shipment(
    payload: ShipmentCreate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminShipmentService(db)
    return service.create_shipment(payload)

@router.get("/{id}", response_model=Shipment)
def get_shipment(
    id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminShipmentService(db)
    return service.get_shipment(id)

@router.patch("/{id}", response_model=Shipment)
def update_shipment(
    id: int,
    payload: ShipmentUpdate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = AdminShipmentService(db)
    return service.update_shipment(id, payload)
