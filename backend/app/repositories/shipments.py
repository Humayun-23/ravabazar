from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.shipments import Shipment

class ShipmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, shipment_id: int) -> Optional[Shipment]:
        return (
            self.db.query(Shipment)
            .filter(Shipment.id == shipment_id)
            .options(joinedload(Shipment.order))
            .first()
        )
        
    def get_by_order_id(self, order_id: int) -> Optional[Shipment]:
        return (
            self.db.query(Shipment)
            .filter(Shipment.order_id == order_id)
            .options(joinedload(Shipment.order))
            .first()
        )

    def create(self, order_id: int, courier_name: str, tracking_number: str) -> Shipment:
        shipment = Shipment(
            order_id=order_id,
            courier_name=courier_name,
            tracking_number=tracking_number,
            status="processing"
        )
        self.db.add(shipment)
        self.db.commit()
        self.db.refresh(shipment)
        return shipment

    def update(self, shipment: Shipment, **kwargs) -> Shipment:
        for key, value in kwargs.items():
            if hasattr(shipment, key):
                setattr(shipment, key, value)
        self.db.commit()
        self.db.refresh(shipment)
        return shipment
