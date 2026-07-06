import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.orders import Order
from app.models.payments import Payment
from app.models.admins import Admin

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
def test_customer_token():
    return create_access_token(
        subject_id=1,
        subject_type="customer"
    )[0]

@pytest.fixture()
def test_payment(db_session):
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
        status="pending_payment",
        payment_method="credit_card"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_123",
        amount=100.0,
        status="success"
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    
    return payment

def test_admin_payments_rbac(client: TestClient, test_customer_token):
    headers = {"Authorization": f"Bearer {test_customer_token}"}
    res = client.get("/api/v1/admin/payments", headers=headers)
    assert res.status_code == 403
    
    res = client.get("/api/v1/admin/payments/1", headers=headers)
    assert res.status_code == 403

def test_admin_list_payments(client: TestClient, test_admin_token, test_payment):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/payments", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == test_payment.id
    
    # filter by status
    res2 = client.get("/api/v1/admin/payments?status=success", headers=headers)
    assert res2.json()["total"] == 1
    
    res3 = client.get("/api/v1/admin/payments?status=pending", headers=headers)
    assert res3.json()["total"] == 0
    
    # filter by provider
    res4 = client.get("/api/v1/admin/payments?provider=razorpay", headers=headers)
    assert res4.json()["total"] == 1

def test_admin_get_payment(client: TestClient, test_admin_token, test_payment):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get(f"/api/v1/admin/payments/{test_payment.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == test_payment.id
    assert data["status"] == "success"
    assert data["provider"] == "razorpay"
