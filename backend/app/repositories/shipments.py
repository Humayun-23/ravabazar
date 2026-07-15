from typing import Optional
from sqlalchemy import or_
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

    def get_by_provider_reference(
        self,
        *,
        provider: str,
        provider_order_id: str | None = None,
        provider_shipment_id: str | None = None,
        awb_number: str | None = None,
    ) -> Optional[Shipment]:
        query = self.db.query(Shipment).filter(Shipment.provider == provider)
        filters = []
        if provider_order_id:
            filters.append(Shipment.provider_order_id == provider_order_id)
        if provider_shipment_id:
            filters.append(Shipment.provider_shipment_id == provider_shipment_id)
        if awb_number:
            filters.append(Shipment.awb_number == awb_number)
            filters.append(Shipment.tracking_number == awb_number)
        if not filters:
            return None
        return query.filter(or_(*filters)).options(joinedload(Shipment.order)).first()

    def create(self, order_id: int, **kwargs) -> Shipment:
        shipment = Shipment(
            order_id=order_id,
            **kwargs,
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
