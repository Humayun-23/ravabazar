from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.core.config import settings
from app.repositories.shipments import ShipmentRepository
from app.repositories.orders import OrderRepository
from app.schemas.shipments import ShipmentCreate, ShipmentUpdate
from app.models.shipments import Shipment
from app.services.admin_orders import AdminOrderService
from app.schemas.admin_orders import AdminOrderStatusUpdate
from app.services.couriers.shiprocket import ShiprocketClient

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

        if order.status != "packed":
            raise HTTPException(status_code=409, detail="Shipment can only be created for packed orders")

        provider = (payload.provider or settings.COURIER_PROVIDER or "manual").lower()
        if provider == "shiprocket":
            shipment_data = ShiprocketClient().create_order(order)
            shipment = self.repo.create(
                order_id=payload.order_id,
                provider="shiprocket",
                provider_order_id=shipment_data.provider_order_id,
                provider_shipment_id=shipment_data.provider_shipment_id,
                awb_number=shipment_data.awb_number,
                tracking_number=shipment_data.awb_number,
                courier_name=shipment_data.courier_company or "Shiprocket",
                courier_company=shipment_data.courier_company,
                courier_company_id=shipment_data.courier_company_id,
                label_url=shipment_data.label_url,
                invoice_url=shipment_data.invoice_url,
                tracking_url=shipment_data.tracking_url,
                pickup_token_number=shipment_data.pickup_token_number,
                raw_provider_payload=shipment_data.raw_provider_payload,
                status=shipment_data.status,
                shipped_at=datetime.utcnow() if shipment_data.status == "shipped" else None,
                delivered_at=datetime.utcnow() if shipment_data.status == "delivered" else None,
            )
            if shipment_data.status in {"shipped", "delivered"}:
                self.order_service.update_status(
                    order_id=payload.order_id,
                    payload=AdminOrderStatusUpdate(status="shipped", note="Shiprocket shipment created"),
                )
                if shipment_data.status == "delivered":
                    self.order_service.update_status(
                        order_id=payload.order_id,
                        payload=AdminOrderStatusUpdate(status="delivered", note="Shiprocket delivered"),
                    )
            return shipment

        shipment = self.repo.create(
            order_id=payload.order_id,
            provider="manual",
            courier_name=payload.courier_name or "",
            tracking_number=payload.tracking_number or "",
            awb_number=payload.awb_number or payload.tracking_number,
            status=payload.status or "processing",
        )
        if shipment.status in {"processing", "shipped"}:
            self.order_service.update_status(
                order_id=payload.order_id, 
                payload=AdminOrderStatusUpdate(status="shipped", note="Shipment created")
            )
            shipment = self.repo.update(shipment, shipped_at=datetime.utcnow())
        return shipment

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
            
        if payload.status == "shipped":
            if shipment.order and shipment.order.status == "packed":
                self.order_service.update_status(
                    order_id=shipment.order_id,
                    payload=AdminOrderStatusUpdate(status="shipped", note="Shipment shipped")
                )
                shipment = self.repo.update(shipment, shipped_at=datetime.utcnow())
        elif payload.status == "delivered":
            if shipment.order and shipment.order.status != "delivered":
                self.order_service.update_status(
                    order_id=shipment.order_id,
                    payload=AdminOrderStatusUpdate(status="delivered", note="Shipment delivered")
                )
                shipment = self.repo.update(shipment, delivered_at=datetime.utcnow())
        elif payload.status == "returned":
            if shipment.order and shipment.order.status == "shipped":
                self.order_service.update_status(
                    order_id=shipment.order_id,
                    payload=AdminOrderStatusUpdate(status="returned", note="Shipment returned")
                )
                
        return shipment
