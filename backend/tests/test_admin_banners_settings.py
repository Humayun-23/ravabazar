import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.banners import Banner
from app.models.settings import Setting

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

def test_admin_banners_crud(client, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    # Create
    payload = {
        "title": "Summer Sale",
        "image_url": "http://image.com/summer.png",
        "position": 1
    }
    res = client.post("/api/v1/admin/banners", headers=headers, json=payload)
    assert res.status_code == 201
    banner_id = res.json()["id"]
    assert res.json()["title"] == "Summer Sale"
    
    # List
    res = client.get("/api/v1/admin/banners", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    
    # Update
    update_payload = {"is_active": False}
    res = client.patch(f"/api/v1/admin/banners/{banner_id}", headers=headers, json=update_payload)
    assert res.status_code == 200
    assert res.json()["is_active"] is False
    
    # Delete
    res = client.delete(f"/api/v1/admin/banners/{banner_id}", headers=headers)
    assert res.status_code == 200
    
    # Verify deleted
    res = client.get(f"/api/v1/admin/banners/{banner_id}", headers=headers)
    assert res.status_code == 404

def test_admin_settings_crud(client, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    # Create
    payload = {
        "key": "contact_email",
        "value": "support@store.com"
    }
    res = client.post("/api/v1/admin/settings", headers=headers, json=payload)
    assert res.status_code == 201
    assert res.json()["key"] == "contact_email"
    
    # Duplicate Create
    res = client.post("/api/v1/admin/settings", headers=headers, json=payload)
    assert res.status_code == 409
    
    # List
    res = client.get("/api/v1/admin/settings", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    
    # Update
    update_payload = {"value": "hello@store.com"}
    res = client.patch("/api/v1/admin/settings/contact_email", headers=headers, json=update_payload)
    assert res.status_code == 200
    assert res.json()["value"] == "hello@store.com"
    
    # Delete
    res = client.delete("/api/v1/admin/settings/contact_email", headers=headers)
    assert res.status_code == 200
    
    # Verify deleted
    res = client.get("/api/v1/admin/settings/contact_email", headers=headers)
    assert res.status_code == 404
