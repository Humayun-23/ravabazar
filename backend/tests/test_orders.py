import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.addresses import Address
from app.models.cart_items import CartItem
from app.models.carts import Cart
from app.models.categories import Category
from app.models.inventory import Inventory
from app.models.order_items import OrderItem
from app.models.orders import Order
from app.models.payments import Payment
from app.models.product_images import ProductImage
from app.models.products import Product, ProductStatus
from app.models.shipments import Shipment
from app.models.users import User


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    User.__table__.create(bind=engine)
    Address.__table__.create(bind=engine)
    Category.__table__.create(bind=engine)
    Product.__table__.create(bind=engine)
    ProductImage.__table__.create(bind=engine)
    Inventory.__table__.create(bind=engine)
    Cart.__table__.create(bind=engine)
    CartItem.__table__.create(bind=engine)
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
        CartItem.__table__.drop(bind=engine)
        Cart.__table__.drop(bind=engine)
        Inventory.__table__.drop(bind=engine)
        ProductImage.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
        Category.__table__.drop(bind=engine)
        Address.__table__.drop(bind=engine)
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
def address(db_session, user):
    address = Address(
        user_id=user.id,
        title="Home",
        street_address="12 Market Road",
        city="Kolkata",
        state="West Bengal",
        postal_code="700001",
        country="India",
        is_default=True,
    )
    db_session.add(address)
    db_session.commit()
    db_session.refresh(address)
    return address


@pytest.fixture()
def product(db_session):
    category = Category(name="Electronics", slug="electronics")
    db_session.add(category)
    db_session.commit()
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
    db_session.commit()
    inventory = Inventory(
        product_id=product.id,
        stock_quantity=10,
        reserved_quantity=2,
    )
    db_session.add(inventory)
    db_session.commit()
    db_session.refresh(product)
    return product


def add_cart_item(db_session, user, product, quantity=2):
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    db_session.flush()
    item = CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity)
    db_session.add(item)
    db_session.commit()
    return cart


def checkout_payload(address, payment_method="razorpay"):
    return {
        "address_id": address.id,
        "payment_method": payment_method,
    }


def test_checkout_creates_order_snapshots_reserves_stock_and_clears_cart(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=2)

    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers={**auth_headers, "Idempotency-Key": "checkout-key-1"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user.id
    assert data["status"] == "pending_payment"
    assert data["payment_method"] == "razorpay"
    assert data["total_amount"] == 180.0
    assert data["final_amount"] == 180.0
    assert data["address_snapshot"]["street_address"] == "12 Market Road"
    assert data["items"][0]["product_name_snapshot"] == "Phone"
    assert data["items"][0]["price_snapshot"] == 90.0
    assert data["items"][0]["quantity"] == 2

    inventory = db_session.query(Inventory).filter_by(product_id=product.id).one()
    assert inventory.stock_quantity == 10
    assert inventory.reserved_quantity == 4
    assert db_session.query(Cart).filter_by(user_id=user.id).first() is None


def test_checkout_is_idempotent_for_same_key_and_body(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=2)
    headers = {**auth_headers, "Idempotency-Key": "checkout-key-2"}

    first = client.post("/api/v1/orders", json=checkout_payload(address), headers=headers)
    second = client.post("/api/v1/orders", json=checkout_payload(address), headers=headers)

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert db_session.query(Order).filter_by(user_id=user.id).count() == 1


def test_checkout_rejects_reused_idempotency_key_with_different_body(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=2)
    headers = {**auth_headers, "Idempotency-Key": "checkout-key-3"}

    assert client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers=headers,
    ).status_code == 201

    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address, payment_method="cod"),
        headers=headers,
    )

    assert response.status_code == 409


def test_checkout_requires_idempotency_key(client, auth_headers, address):
    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_checkout_rejects_empty_cart(client, auth_headers, address):
    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers={**auth_headers, "Idempotency-Key": "checkout-key-empty"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "BAD_REQUEST"


def test_checkout_rejects_insufficient_stock(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=9)

    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers={**auth_headers, "Idempotency-Key": "checkout-key-stock"},
    )

    assert response.status_code == 400
    inventory = db_session.query(Inventory).filter_by(product_id=product.id).one()
    assert inventory.reserved_quantity == 2


def test_cod_checkout_uses_cod_pending_status(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=1)

    response = client.post(
        "/api/v1/orders",
        json=checkout_payload(address, payment_method="cod"),
        headers={**auth_headers, "Idempotency-Key": "checkout-key-cod"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "cod_pending"


def test_list_detail_and_cancel_order_release_reserved_stock(
    client,
    db_session,
    user,
    auth_headers,
    address,
    product,
):
    add_cart_item(db_session, user, product, quantity=2)
    checkout = client.post(
        "/api/v1/orders",
        json=checkout_payload(address),
        headers={**auth_headers, "Idempotency-Key": "checkout-key-cancel"},
    )
    order_id = checkout.json()["id"]

    list_response = client.get("/api/v1/orders/my", headers=auth_headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail_response = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == order_id

    cancel_response = client.post(
        f"/api/v1/orders/{order_id}/cancel",
        json={"reason": "Ordered by mistake"},
        headers=auth_headers,
    )

    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"
    inventory = db_session.query(Inventory).filter_by(product_id=product.id).one()
    assert inventory.reserved_quantity == 2
