import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch

from app.core.dependencies import get_db
from app.core.security import hash_password
from app.main import app
from app.models.admins import Admin
from app.models.refresh_tokens import RefreshToken
from app.models.users import User
from app.models.otp import OTPVerification


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    User.__table__.create(bind=engine)
    Admin.__table__.create(bind=engine)
    RefreshToken.__table__.create(bind=engine)
    OTPVerification.__table__.create(bind=engine)

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
        OTPVerification.__table__.drop(bind=engine)
        RefreshToken.__table__.drop(bind=engine)
        Admin.__table__.drop(bind=engine)
        User.__table__.drop(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_customer_register_login_me_refresh_and_logout(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "phone": "9999999999",
            "email": "customer@example.com",
            "password": "strong-password",
            "first_name": "Asha",
            "last_name": "Khan",
        },
    )

    assert register_response.status_code == 201
    registered_user = register_response.json()
    assert registered_user["phone"] == "9999999999"
    assert "hashed_password" not in registered_user

    login_response = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "strong-password"},
    )

    assert login_response.status_code == 200
    tokens = login_response.json()
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    assert tokens["refresh_token"]
    assert tokens["user"]["phone"] == "9999999999"

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["phone"] == "9999999999"

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]

    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    assert logout_response.status_code == 204

    revoked_refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert revoked_refresh_response.status_code == 401


def test_duplicate_customer_phone_is_rejected(client):
    payload = {
        "phone": "9999999999",
        "email": "customer@example.com",
        "password": "strong-password",
    }

    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate_response = client.post("/api/v1/auth/register", json=payload)

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["error"]["code"] == "CONFLICT"


def test_customer_login_rejects_bad_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "phone": "9999999999",
            "email": "customer@example.com",
            "password": "strong-password",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_admin_login_and_refresh_are_separate_from_customer_tokens(client, db_session):
    admin = Admin(
        email="admin@example.com",
        hashed_password=hash_password("admin-password"),
        first_name="Admin",
        last_name="User",
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()

    admin_login_response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@example.com", "password": "admin-password"},
    )

    assert admin_login_response.status_code == 200
    admin_tokens = admin_login_response.json()
    assert admin_tokens["admin"]["email"] == "admin@example.com"
    assert admin_tokens["refresh_token"]

    admin_refresh_response = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": admin_tokens["refresh_token"]},
    )

    assert admin_refresh_response.status_code == 200
    assert admin_refresh_response.json()["access_token"]

    client.post(
        "/api/v1/auth/register",
        json={
            "phone": "9999999999",
            "email": "customer@example.com",
            "password": "strong-password",
        },
    )
    customer_login_response = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "strong-password"},
    )
    customer_refresh_token = customer_login_response.json()["refresh_token"]

    rejected_response = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": customer_refresh_token},
    )

    assert rejected_response.status_code == 401


    admin_logout_response = client.post(
        "/api/v1/admin/auth/logout",
        headers={"Authorization": f"Bearer {admin_tokens['access_token']}"},
    )
    assert admin_logout_response.status_code == 204

    admin_revoked_refresh = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": admin_tokens["refresh_token"]},
    )
    assert admin_revoked_refresh.status_code == 401


def test_admin_login_rejects_inactive_admin(client, db_session):
    admin = Admin(
        email="inactive@example.com",
        hashed_password=hash_password("admin-password"),
        role="admin",
        is_active=False,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "inactive@example.com", "password": "admin-password"},
    )

    assert response.status_code == 403


@patch("app.services.auth.id_token.verify_oauth2_token")
def test_google_login_new_user_requires_phone(mock_verify, client):
    mock_verify.return_value = {
        "sub": "12345",
        "email": "googleuser@example.com",
        "given_name": "Google",
        "family_name": "User"
    }
    
    response = client.post(
        "/api/v1/auth/google",
        json={"token": "fake-jwt-token"}
    )
    
    assert response.status_code == 428
    assert response.json()["error"]["code"] == "PRECONDITION_REQUIRED"


@patch("app.services.auth.id_token.verify_oauth2_token")
def test_google_login_new_user_with_phone_creates_account(mock_verify, client):
    mock_verify.return_value = {
        "sub": "123456",
        "email": "googleuser2@example.com",
        "given_name": "Google",
        "family_name": "User"
    }
    
    response = client.post(
        "/api/v1/auth/google",
        json={"token": "fake-jwt-token", "phone": "1234567890"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "googleuser2@example.com"
    assert data["user"]["phone"] == "1234567890"


@patch("app.services.auth.id_token.verify_oauth2_token")
def test_google_login_links_existing_email(mock_verify, client, db_session):
    # First, create a regular user
    user = User(
        phone="0987654321",
        email="existing@example.com",
        hashed_password="some-hash",
        first_name="Existing",
        last_name="User",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    mock_verify.return_value = {
        "sub": "99999",
        "email": "existing@example.com",
        "given_name": "Existing",
        "family_name": "User"
    }
    
    response = client.post(
        "/api/v1/auth/google",
        json={"token": "fake-jwt-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "existing@example.com"
    assert data["user"]["phone"] == "0987654321"

    # Verify that the google_id was updated in the DB
    db_session.refresh(user)
    assert user.google_id == "99999"


@patch("app.services.auth.id_token.verify_oauth2_token")
def test_google_login_invalid_token(mock_verify, client):
    mock_verify.side_effect = ValueError("Invalid token")
    
    response = client.post(
        "/api/v1/auth/google",
        json={"token": "invalid-token"}
    )
    
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@patch("app.services.auth.settings.ENABLE_MOBILE_OTP_VERIFICATION", True)
def test_mobile_otp_request_and_verify(client, db_session):
    # 1. Request OTP
    req_response = client.post("/api/v1/auth/request-otp", json={"phone": "9876543210"})
    assert req_response.status_code == 200
    assert req_response.json()["message"] == "OTP sent successfully"

    # Fetch OTP from DB to simulate user receiving code
    otp_record = db_session.query(OTPVerification).filter(OTPVerification.phone == "9876543210").first()
    assert otp_record is not None
    assert otp_record.otp_code

    # 2. Verify invalid OTP
    invalid_verify = client.post("/api/v1/auth/verify-otp", json={"phone": "9876543210", "otp": "000000"})
    assert invalid_verify.status_code == 401

    # 3. Verify valid OTP (should auto-create customer and return tokens)
    valid_verify = client.post("/api/v1/auth/verify-otp", json={"phone": "9876543210", "otp": otp_record.otp_code})
    assert valid_verify.status_code == 200
    data = valid_verify.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "9876543210"


def test_mobile_otp_disabled_returns_400(client):
    req_response = client.post("/api/v1/auth/request-otp", json={"phone": "9876543210"})
    assert req_response.status_code == 400


