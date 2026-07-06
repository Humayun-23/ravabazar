import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
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

def test_admin_upload_image_rbac(client: TestClient, test_customer_token):
    headers = {"Authorization": f"Bearer {test_customer_token}"}
    files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
    res = client.post("/api/v1/uploads/images", headers=headers, files=files)
    assert res.status_code == 403

@patch("cloudinary.uploader.upload")
def test_admin_upload_image_success(mock_upload, client: TestClient, test_admin_token):
    # Setup mock response
    mock_upload.return_value = {
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234/test.jpg"
    }
    
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
    data = {"folder": "test_folder"}
    
    res = client.post("/api/v1/uploads/images", headers=headers, files=files, data=data)
    assert res.status_code == 201
    
    response_data = res.json()
    assert response_data["image_url"] == "https://res.cloudinary.com/demo/image/upload/v1234/test.jpg"
    assert response_data["provider"] == "cloudinary"
    
    # Verify mock was called correctly
    mock_upload.assert_called_once()
    args, kwargs = mock_upload.call_args
    assert args[0] == b"fake image content"
    assert kwargs["folder"] == "test_folder"

def test_admin_upload_invalid_content_type(client: TestClient, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    files = {"file": ("test.txt", b"fake text content", "text/plain")}
    
    res = client.post("/api/v1/uploads/images", headers=headers, files=files)
    assert res.status_code == 400
    assert "not an image" in res.json()["error"]["message"]
