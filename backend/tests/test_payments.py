import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.categories import Category
from app.models.inventory import Inventory
from app.models.order_items import OrderItem
from app.models.orders import Order
from app.models.payments import Payment
from app.models.products import Product, ProductStatus
from app.models.shipments import Shipment
from app.models.users import User
from app.services import payments as payment_service_module
from app.services.payments import PaymentService


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    User.__table__.create(bind=engine)
    Category.__table__.create(bind=engine)
    Product.__table__.create(bind=engine)
    Inventory.__table__.create(bind=engine)
    Order.__table__.create(bind=engine)
    OrderItem.__table__.create(bind=engine)
    Payment.__table__.create(bind=engine)
    Shipment.__table__.create(bind=engine)

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
        Shipment.__table__.drop(bind=engine)
        Payment.__table__.drop(bind=engine)
        OrderItem.__table__.drop(bind=engine)
        Order.__table__.drop(bind=engine)
        Inventory.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
        Category.__table__.drop(bind=engine)
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


@pytest.fixture(autouse=True)
def payment_settings(monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "razorpay_secret")
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", "razorpay_webhook_secret")
    monkeypatch.setattr(settings, "CASHFREE_APP_ID", "cashfree_test_app")
    monkeypatch.setattr(settings, "CASHFREE_SECRET_KEY", "cashfree_secret")
    monkeypatch.setattr(settings, "CASHFREE_WEBHOOK_SECRET", "cashfree_webhook_secret")


@pytest.fixture()
def user(db_session):
    user = User(phone="9999999999", hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(user):
    access_token, _, _ = create_access_token(user.id, "customer")
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture()
def product(db_session):
    category = Category(name="Electronics", slug="electronics")
    db_session.add(category)
    db_session.flush()
    product = Product(
        name="Phone",
        slug="phone",
        sku="PHN-001",
        price=100.0,
        sale_price=90.0,
        status=ProductStatus.active,
        category_id=category.id,
    )
    db_session.add(product)
    db_session.flush()
    inventory = Inventory(
        product_id=product.id,
        stock_quantity=10,
        reserved_quantity=2,
    )
    db_session.add(inventory)
    db_session.commit()
    db_session.refresh(product)
    return product


def make_order(db_session, user, product, *, status="pending_payment", payment_method="razorpay"):
    order = Order(
        user_id=user.id,
        address_snapshot={
            "street_address": "12 Market Road",
            "city": "Kolkata",
            "state": "West Bengal",
            "postal_code": "700001",
            "country": "India",
        },
        total_amount=180.0,
        shipping_fee=0.0,
        tax=0.0,
        final_amount=180.0,
        status=status,
        payment_method=payment_method,
    )
    db_session.add(order)
    db_session.flush()
    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        product_name_snapshot=product.name,
        price_snapshot=90.0,
        quantity=2,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)
    return order


def sign_payment(provider_order_id, provider_payment_id, secret="razorpay_secret"):
    message = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def sign_body(raw_body, secret="razorpay_webhook_secret"):
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


def test_create_payment_order_uses_backend_order_amount(
    client,
    db_session,
    user,
    auth_headers,
    product,
    monkeypatch,
):
    created_provider_orders = []

    def fake_create_razorpay_order(self, order):
        created_provider_orders.append(order.final_amount)
        return "order_rzp_test"

    monkeypatch.setattr(
        PaymentService,
        "_create_razorpay_order",
        fake_create_razorpay_order,
    )
    order = make_order(db_session, user, product)

    response = client.post(
        "/api/v1/payments/create-order",
        json={"order_id": order.id, "provider": "razorpay"},
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["order_id"] == order.id
    assert data["provider"] == "razorpay"
    assert data["amount"] == 180.0
    assert data["status"] == "created"
    assert data["client_payload"] == {
        "key": "rzp_test_key",
        "order_id": data["provider_order_id"],
        "amount": 18000,
        "currency": "INR",
        "name": "Ravabazar",
        "description": f"Order #{order.id}",
    }
    assert data["provider_order_id"] == "order_rzp_test"
    assert created_provider_orders == [180.0]

    payment = db_session.query(Payment).filter_by(order_id=order.id).one()
    assert payment.amount == 180.0
    assert payment.status == "created"
    assert payment.provider_order_id == "order_rzp_test"


def test_create_payment_order_reuses_existing_created_provider_order(
    client,
    db_session,
    user,
    auth_headers,
    product,
    monkeypatch,
):
    def fail_if_called(self, order):
        raise AssertionError("Existing created payments should not create a new provider order")

    monkeypatch.setattr(
        PaymentService,
        "_create_razorpay_order",
        fail_if_called,
    )
    order = make_order(db_session, user, product)
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_existing",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()

    response = client.post(
        "/api/v1/payments/create-order",
        json={"order_id": order.id, "provider": "razorpay"},
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["provider_order_id"] == "order_existing"


def test_create_razorpay_order_posts_backend_amount_and_auth(
    db_session,
    user,
    product,
    monkeypatch,
):
    order = make_order(db_session, user, product)
    calls = []

    class FakeRazorpayResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"id": "order_live_123"}

    class FakeHttpxClient:
        def __init__(self, *, timeout):
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def post(self, url, *, json, auth):
            calls.append(
                {
                    "timeout": self.timeout,
                    "url": url,
                    "json": json,
                    "auth": auth,
                }
            )
            return FakeRazorpayResponse()

    monkeypatch.setattr(payment_service_module.httpx, "Client", FakeHttpxClient)

    provider_order_id = PaymentService(db_session)._create_razorpay_order(order)

    assert provider_order_id == "order_live_123"
    assert calls == [
        {
            "timeout": 15.0,
            "url": "https://api.razorpay.com/v1/orders",
            "json": {
                "amount": 18000,
                "currency": "INR",
                "receipt": f"rvbz_order_{order.id}",
                "notes": {
                    "ravabazar_order_id": str(order.id),
                    "ravabazar_user_id": str(user.id),
                },
            },
            "auth": ("rzp_test_key", "razorpay_secret"),
        }
    ]


def test_create_payment_order_rejects_non_pending_order(
    client,
    db_session,
    user,
    auth_headers,
    product,
):
    order = make_order(
        db_session,
        user,
        product,
        status="cod_pending",
        payment_method="cod",
    )

    response = client.post(
        "/api/v1/payments/create-order",
        json={"order_id": order.id, "provider": "razorpay"},
        headers=auth_headers,
    )

    assert response.status_code == 409


def test_create_payment_order_requires_order_owner(
    client,
    db_session,
    user,
    auth_headers,
    product,
):
    other_user = User(phone="8888888888", hashed_password="hashed")
    db_session.add(other_user)
    db_session.commit()
    order = make_order(db_session, other_user, product)

    response = client.post(
        "/api/v1/payments/create-order",
        json={"order_id": order.id, "provider": "razorpay"},
        headers=auth_headers,
    )

    assert response.status_code == 404


def test_verify_rejects_invalid_signature_without_marking_paid(
    client,
    db_session,
    user,
    auth_headers,
    product,
):
    order = make_order(db_session, user, product)
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_razorpay_test",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()

    response = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order.id,
            "provider": "razorpay",
            "provider_order_id": "order_razorpay_test",
            "provider_payment_id": "pay_test",
            "signature": "bad-signature",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    db_session.refresh(order)
    db_session.refresh(payment)
    assert order.status == "pending_payment"
    assert payment.status == "created"


def test_verify_valid_signature_marks_payment_verified_and_order_paid(
    client,
    db_session,
    user,
    auth_headers,
    product,
):
    order = make_order(db_session, user, product)
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_razorpay_test",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()

    provider_payment_id = "pay_test"
    response = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order.id,
            "provider": "razorpay",
            "provider_order_id": payment.provider_order_id,
            "provider_payment_id": provider_payment_id,
            "signature": sign_payment(payment.provider_order_id, provider_payment_id),
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {
        "payment_id": payment.id,
        "order_id": order.id,
        "status": "verified",
        "order_status": "paid",
    }
    db_session.refresh(order)
    db_session.refresh(payment)
    assert order.status == "paid"
    assert payment.status == "verified"
    assert payment.provider_payment_id == provider_payment_id


def test_verify_rejects_cancelled_order_without_marking_paid(
    client,
    db_session,
    user,
    auth_headers,
    product,
):
    order = make_order(db_session, user, product, status="cancelled")
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_razorpay_test",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()

    provider_payment_id = "pay_test"
    response = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order.id,
            "provider": "razorpay",
            "provider_order_id": payment.provider_order_id,
            "provider_payment_id": provider_payment_id,
            "signature": sign_payment(payment.provider_order_id, provider_payment_id),
        },
        headers=auth_headers,
    )

    assert response.status_code == 409
    db_session.refresh(order)
    db_session.refresh(payment)
    assert order.status == "cancelled"
    assert payment.status == "created"


def test_webhook_valid_signature_marks_payment_verified_and_is_idempotent(
    client,
    db_session,
    user,
    product,
):
    order = make_order(db_session, user, product)
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_razorpay_test",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()
    payload = {
        "provider_order_id": payment.provider_order_id,
        "provider_payment_id": "pay_webhook",
        "status": "captured",
    }
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    headers = {
        "content-type": "application/json",
        "X-Razorpay-Signature": sign_body(raw_body),
    }

    first = client.post("/api/v1/payments/webhook", content=raw_body, headers=headers)
    second = client.post("/api/v1/payments/webhook", content=raw_body, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == {"received": True}
    db_session.refresh(order)
    db_session.refresh(payment)
    assert order.status == "paid"
    assert payment.status == "verified"
    assert payment.provider_payment_id == "pay_webhook"


def test_webhook_rejects_invalid_signature_without_marking_paid(
    client,
    db_session,
    user,
    product,
):
    order = make_order(db_session, user, product)
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id="order_razorpay_test",
        amount=order.final_amount,
        status="created",
    )
    db_session.add(payment)
    db_session.commit()
    payload = {
        "provider_order_id": payment.provider_order_id,
        "provider_payment_id": "pay_webhook",
        "status": "captured",
    }
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    response = client.post(
        "/api/v1/payments/webhook",
        content=raw_body,
        headers={
            "content-type": "application/json",
            "X-Razorpay-Signature": "bad-signature",
        },
    )

    assert response.status_code == 400
    db_session.refresh(order)
    db_session.refresh(payment)
    assert order.status == "pending_payment"
    assert payment.status == "created"
