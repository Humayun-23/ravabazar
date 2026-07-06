from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.shipments import ShipmentRepository
from app.repositories.orders import OrderRepository
from app.schemas.shipments import ShipmentCreate, ShipmentUpdate
from app.models.shipments import Shipment
from app.services.admin_orders import AdminOrderService
from app.schemas.admin_orders import AdminOrderStatusUpdate

class AdminShipmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ShipmentRepository(db)
        self.order_repo = OrderRepository(db)
        self.order_service = AdminOrderService(db)

    def create_shipment(self, payload: ShipmentCreate) -> Shipment:
        order = self.order_repo.get_by_id_admin(payload.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        existing = self.repo.get_by_order_id(payload.order_id)
        if existing:
            raise HTTPException(status_code=400, detail="Shipment already exists for this order")
            
        # Creating a shipment implies the order is shipped. So transition the order first
        if order.status != "shipped":
            self.order_service.update_status(
                order_id=payload.order_id, 
                payload=AdminOrderStatusUpdate(status="shipped", note="Shipment created")
            )
            
        return self.repo.create(
            order_id=payload.order_id,
            courier_name=payload.courier_name or "",
            tracking_number=payload.tracking_number or ""
        )

    def get_shipment(self, shipment_id: int) -> Shipment:
        shipment = self.repo.get_by_id(shipment_id)
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        return shipment

    def update_shipment(self, shipment_id: int, payload: ShipmentUpdate) -> Shipment:
        shipment = self.repo.get_by_id(shipment_id)
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
            
        update_data = payload.model_dump(exclude_unset=True)
        if update_data:
            shipment = self.repo.update(shipment, **update_data)
            
        # If shipment status changes to delivered, update the order as well
        if payload.status == "delivered":
            if shipment.order and shipment.order.status != "delivered":
                self.order_service.update_status(
                    order_id=shipment.order_id,
                    payload=AdminOrderStatusUpdate(status="delivered", note="Shipment delivered")
                )
                
        return shipment
