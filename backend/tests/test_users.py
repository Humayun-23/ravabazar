import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db, get_current_user
from app.main import app
from app.models.users import User
from app.models.addresses import Address

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    User.__table__.create(bind=engine)
    Address.__table__.create(bind=engine)

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
        Address.__table__.drop(bind=engine)
        User.__table__.drop(bind=engine)
        engine.dispose()

@pytest.fixture()
def test_user(db_session):
    user = User(
        phone="1234567890",
        hashed_password="hashed_pw",
        email="test@example.com",
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture()
def client(db_session, test_user):
    def override_get_db():
        yield db_session

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()

def test_get_me(client, test_user):
    res = client.get("/api/v1/users/me")
    assert res.status_code == 200
    assert res.json()["email"] == test_user.email

def test_update_profile(client):
    res = client.patch("/api/v1/users/me", json={"first_name": "Updated"})
    assert res.status_code == 200
    assert res.json()["first_name"] == "Updated"

def test_address_crud(client):
    # Create Address
    create_payload = {
        "title": "Home",
        "street_address": "123 Main St",
        "city": "NY",
        "state": "NY",
        "postal_code": "10001",
        "country": "USA",
        "is_default": False
    }
    res = client.post("/api/v1/users/me/addresses", json=create_payload)
    assert res.status_code == 201
    address_id = res.json()["id"]
    assert res.json()["is_default"] == True  # Auto-promoted to default as it's the first

    # Get Addresses
    res = client.get("/api/v1/users/me/addresses")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == address_id

    # Create Second Address explicitly as default
    create_payload["title"] = "Work"
    create_payload["is_default"] = True
    res = client.post("/api/v1/users/me/addresses", json=create_payload)
    assert res.status_code == 201
    address_id_2 = res.json()["id"]

    # Verify first address is no longer default
    res = client.get("/api/v1/users/me/addresses")
    for addr in res.json():
        if addr["id"] == address_id:
            assert addr["is_default"] == False
        elif addr["id"] == address_id_2:
            assert addr["is_default"] == True

    # Update first address
    res = client.patch(f"/api/v1/users/me/addresses/{address_id}", json={"city": "LA"})
    assert res.status_code == 200
    assert res.json()["city"] == "LA"

    # Delete address
    res = client.delete(f"/api/v1/users/me/addresses/{address_id}")
    assert res.status_code == 204

    res = client.get("/api/v1/users/me/addresses")
    assert len(res.json()) == 1

def test_address_not_found_or_forbidden(client):
    res = client.patch("/api/v1/users/me/addresses/999", json={"city": "LA"})
    assert res.status_code == 404
