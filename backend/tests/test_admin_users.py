import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.users import User

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
def test_users(db_session):
    u1 = User(phone="111", email="alice@test.com", first_name="Alice", last_name="Smith", hashed_password="pw")
    u2 = User(phone="222", email="bob@test.com", first_name="Bob", last_name="Jones", hashed_password="pw")
    db_session.add_all([u1, u2])
    db_session.commit()
    return u1, u2

def test_admin_list_users(client, test_admin_token, test_users):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/users", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    
def test_admin_list_users_search(client, test_admin_token, test_users):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/users?search=alice", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["email"] == "alice@test.com"

def test_admin_get_user(client, test_admin_token, test_users):
    u1 = test_users[0]
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get(f"/api/v1/admin/users/{u1.id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["phone"] == "111"

def test_admin_get_user_not_found(client, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/users/999", headers=headers)
    assert res.status_code == 404
