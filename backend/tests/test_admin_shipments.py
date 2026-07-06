import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.orders import Order

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
