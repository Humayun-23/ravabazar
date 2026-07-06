import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.coupons import Coupon

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
def test_coupon(db_session):
    c1 = Coupon(code="TEST10", discount_type="percentage", discount_value=10.0, is_active=True)
    db_session.add(c1)
    db_session.commit()
    return c1

def test_admin_list_coupons(client, test_admin_token, test_coupon):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/coupons", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["code"] == "TEST10"

def test_admin_create_coupon(client, test_admin_token, db_session):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "code": "NEW20",
        "discount_type": "fixed",
        "discount_value": 20.0,
        "min_order_value": 100.0,
        "usage_limit": 10,
        "is_active": True
    }
    res = client.post("/api/v1/admin/coupons", headers=headers, json=payload)
    assert res.status_code == 201
    assert res.json()["code"] == "NEW20"
    
    # Verify in DB
    c = db_session.query(Coupon).filter_by(code="NEW20").first()
    assert c is not None
    assert c.usage_limit == 10

def test_admin_create_coupon_duplicate(client, test_admin_token, test_coupon):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "code": "TEST10",
        "discount_type": "fixed",
        "discount_value": 20.0
    }
    res = client.post("/api/v1/admin/coupons", headers=headers, json=payload)
    assert res.status_code == 409

def test_admin_update_coupon(client, test_admin_token, test_coupon, db_session):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "is_active": False,
        "discount_value": 15.0
    }
    res = client.patch(f"/api/v1/admin/coupons/{test_coupon.id}", headers=headers, json=payload)
    assert res.status_code == 200
    assert res.json()["is_active"] is False
    assert res.json()["discount_value"] == 15.0
    
    # DB verify
    db_session.refresh(test_coupon)
    assert test_coupon.is_active is False
    assert test_coupon.discount_value == 15.0

def test_admin_update_coupon_duplicate_code(client, test_admin_token, test_coupon, db_session):
    c2 = Coupon(code="OTHER", discount_type="fixed", discount_value=1.0)
    db_session.add(c2)
    db_session.commit()
    
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "code": "TEST10"
    }
    res = client.patch(f"/api/v1/admin/coupons/{c2.id}", headers=headers, json=payload)
    assert res.status_code == 409
