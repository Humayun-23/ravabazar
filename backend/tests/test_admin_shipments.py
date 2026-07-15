import pytest
import hashlib
import hmac
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.orders import Order
from app.models.shipments import Shipment
from app.services.couriers.shiprocket import ShiprocketClient, ShiprocketShipmentData

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.core.database import Base
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture()
def test_admin_token(db_session):
    admin = Admin(
        first_name="Admin",
        email="admin@example.com",
        hashed_password="hash",
        role="admin"
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    
    return create_access_token(
        subject_id=admin.id,
        subject_type="admin"
    )[0]

@pytest.fixture()
def test_order(db_session):
    from app.models.users import User
    user = User(
        email="test@example.com",
        hashed_password="hash",
        phone="1234567890"
    )
    db_session.add(user)
    db_session.commit()
    
    order = Order(
        user_id=user.id,
        address_snapshot={"city": "Test"},
        total_amount=100.0,
        final_amount=100.0,
        status="packed",
        payment_method="credit_card"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    
    return order

def test_admin_create_shipment(client: TestClient, test_admin_token, test_order):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "order_id": test_order.id,
        "tracking_number": "TRK123456",
        "courier_name": "FedEx",
    }
    
    res = client.post("/api/v1/admin/shipments", headers=headers, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["tracking_number"] == "TRK123456"
    assert data["status"] == "processing"
    
    # Check if order status was automatically updated to shipped
    res_order = client.get(f"/api/v1/admin/orders/{test_order.id}", headers=headers)
    assert res_order.json()["status"] == "shipped"

def test_admin_update_shipment(client: TestClient, test_admin_token, test_order):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "order_id": test_order.id,
        "tracking_number": "TRK123456",
        "courier_name": "FedEx",
    }
    res = client.post("/api/v1/admin/shipments", headers=headers, json=payload)
    shipment_id = res.json()["id"]
    
    update_payload = {
        "status": "delivered"
    }
    res2 = client.patch(f"/api/v1/admin/shipments/{shipment_id}", headers=headers, json=update_payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "delivered"
    
    # Check if order status was automatically updated to delivered
    res_order = client.get(f"/api/v1/admin/orders/{test_order.id}", headers=headers)
    assert res_order.json()["status"] == "delivered"

def test_admin_create_shiprocket_shipment(client: TestClient, test_admin_token, test_order, monkeypatch):
    def fake_create_order(self, order):
        return ShiprocketShipmentData(
            provider_order_id="sr_order_123",
            provider_shipment_id="sr_shipment_123",
            awb_number="AWB123456",
            courier_company="Delhivery",
            courier_company_id="10",
            label_url="https://shiprocket.example/label.pdf",
            invoice_url=None,
            tracking_url="https://shiprocket.example/track/AWB123456",
            pickup_token_number=None,
            status="shipped",
            raw_provider_payload={"shipment_id": "sr_shipment_123"},
        )

    monkeypatch.setattr(ShiprocketClient, "create_order", fake_create_order)
    headers = {"Authorization": f"Bearer {test_admin_token}"}

    res = client.post(
        "/api/v1/admin/shipments",
        headers=headers,
        json={"order_id": test_order.id, "provider": "shiprocket"},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["provider"] == "shiprocket"
    assert data["provider_order_id"] == "sr_order_123"
    assert data["provider_shipment_id"] == "sr_shipment_123"
    assert data["tracking_number"] == "AWB123456"
    assert data["courier_company"] == "Delhivery"
    assert data["status"] == "shipped"

    res_order = client.get(f"/api/v1/admin/orders/{test_order.id}", headers=headers)
    assert res_order.json()["status"] == "shipped"

def test_shiprocket_shipment_without_awb_keeps_order_packed(
    client: TestClient,
    test_admin_token,
    test_order,
    monkeypatch,
):
    def fake_create_order(self, order):
        return ShiprocketShipmentData(
            provider_order_id="sr_order_123",
            provider_shipment_id="sr_shipment_123",
            awb_number=None,
            courier_company=None,
            courier_company_id=None,
            label_url=None,
            invoice_url=None,
            tracking_url=None,
            pickup_token_number=None,
            status="created",
            raw_provider_payload={"shipment_id": "sr_shipment_123"},
        )

    monkeypatch.setattr(ShiprocketClient, "create_order", fake_create_order)
    headers = {"Authorization": f"Bearer {test_admin_token}"}

    res = client.post(
        "/api/v1/admin/shipments",
        headers=headers,
        json={"order_id": test_order.id, "provider": "shiprocket"},
    )

    assert res.status_code == 201
    assert res.json()["status"] == "created"

    res_order = client.get(f"/api/v1/admin/orders/{test_order.id}", headers=headers)
    assert res_order.json()["status"] == "packed"

def test_shiprocket_webhook_marks_delivered(client: TestClient, db_session, test_order, monkeypatch):
    monkeypatch.setattr(settings, "SHIPROCKET_WEBHOOK_SECRET", "shiprocket_secret")
    test_order.status = "shipped"
    shipment = Shipment(
        order_id=test_order.id,
        provider="shiprocket",
        provider_order_id="sr_order_123",
        provider_shipment_id="sr_shipment_123",
        awb_number="AWB123456",
        tracking_number="AWB123456",
        status="shipped",
    )
    db_session.add(test_order)
    db_session.add(shipment)
    db_session.commit()

    raw_body = (
        b'{"shipment_id":"sr_shipment_123","awb":"AWB123456",'
        b'"current_status":"Delivered","courier_name":"Delhivery"}'
    )
    signature = hmac.new(
        b"shiprocket_secret",
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    res = client.post(
        "/api/v1/shiprocket/webhook",
        content=raw_body,
        headers={
            "content-type": "application/json",
            "X-Shiprocket-Signature": signature,
        },
    )

    assert res.status_code == 200
    assert res.json() == {"received": True}
    db_session.refresh(test_order)
    db_session.refresh(shipment)
    assert test_order.status == "delivered"
    assert shipment.status == "delivered"
    assert shipment.courier_name == "Delhivery"
