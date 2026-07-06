import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.carts import Cart
from app.models.cart_items import CartItem
from app.models.products import Product, ProductStatus
from app.models.product_images import ProductImage
from app.models.users import User
from app.models.inventory import Inventory
from app.models.categories import Category

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
    ProductImage.__table__.create(bind=engine)
    Inventory.__table__.create(bind=engine)
    Cart.__table__.create(bind=engine)
    CartItem.__table__.create(bind=engine)

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
        CartItem.__table__.drop(bind=engine)
        Cart.__table__.drop(bind=engine)
        Inventory.__table__.drop(bind=engine)
        ProductImage.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
        Category.__table__.drop(bind=engine)
        User.__table__.drop(bind=engine)
        engine.dispose()

@pytest.fixture()
def test_user(db_session):
    user = User(
        phone="1234567890",
        hashed_password="hashed_pw",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def customer_auth_headers(test_user):
    access_token, _, _ = create_access_token(test_user.id, "customer")
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture()
def test_product(db_session):
    cat = Category(name="Electronics", slug="electronics")
    db_session.add(cat)
    db_session.commit()
    prod = Product(
        name="Phone",
        slug="phone",
        sku="PHN-001",
        price=100.0,
        status=ProductStatus.active,
        category_id=cat.id
    )
    db_session.add(prod)
    db_session.commit()
    inv = Inventory(product_id=prod.id, stock_quantity=15, reserved_quantity=0)
    db_session.add(inv)
    db_session.commit()
    return prod

@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_guest_cart(client, test_product):
    headers = {"X-Cart-Session": "guest123"}
    
    # Add Item
    res = client.post("/api/v1/cart/items", json={"product_id": test_product.id, "quantity": 2}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == "guest123"
    assert data["subtotal"] == 200.0
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    item_id = data["items"][0]["id"]

    # Update Item
    res = client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 5}, headers=headers)
    assert res.status_code == 200
    assert res.json()["items"][0]["quantity"] == 5
    assert res.json()["subtotal"] == 500.0

    # Max Limit
    res = client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 11}, headers=headers)
    assert res.status_code == 400

    # Delete Item
    res = client.delete(f"/api/v1/cart/items/{item_id}", headers=headers)
    assert res.status_code == 204

    # Fetch Cart
    res = client.get("/api/v1/cart", headers=headers)
    assert len(res.json()["items"]) == 0

def test_authenticated_cart(client, test_user, test_product, customer_auth_headers):
    res = client.post(
        "/api/v1/cart/items",
        json={"product_id": test_product.id, "quantity": 1},
        headers=customer_auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == test_user.id


def test_authenticated_cart_ignores_guest_session_header(
    client,
    db_session,
    test_user,
    test_product,
    customer_auth_headers,
):
    headers = {
        **customer_auth_headers,
        "X-Cart-Session": "guest-session-after-login",
    }
    res = client.post(
        "/api/v1/cart/items",
        json={"product_id": test_product.id, "quantity": 2},
        headers=headers,
    )

    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == test_user.id
    assert data["session_id"] is None

    user_cart = db_session.query(Cart).filter(Cart.user_id == test_user.id).one()
    assert user_cart.session_id is None

    guest_res = client.get(
        "/api/v1/cart",
        headers={"X-Cart-Session": "guest-session-after-login"},
    )

    assert guest_res.status_code == 200
    guest_data = guest_res.json()
    assert guest_data["user_id"] is None
    assert guest_data["session_id"] == "guest-session-after-login"
    assert guest_data["items"] == []


def test_invalid_auth_token_with_guest_session_is_rejected(client):
    res = client.get(
        "/api/v1/cart",
        headers={
            "Authorization": "Bearer invalid-token",
            "X-Cart-Session": "guest-session",
        },
    )

    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_merge_carts(client, test_user, test_product, customer_auth_headers):
    # 1. Create Guest Cart
    guest_headers = {"X-Cart-Session": "guest_merge_test"}
    client.post("/api/v1/cart/items", json={"product_id": test_product.id, "quantity": 3}, headers=guest_headers)

    # Let's say user already had 1 of the item in their cart
    client.post(
        "/api/v1/cart/items",
        json={"product_id": test_product.id, "quantity": 1},
        headers=customer_auth_headers,
    )
    
    # Merge guest cart
    res = client.post(
        "/api/v1/cart/merge",
        json={"session_id": "guest_merge_test"},
        headers=customer_auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == test_user.id
    
    # The quantity should be 1 + 3 = 4
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 4

    res = client.get("/api/v1/cart", headers=guest_headers)
    # The service will just return a new empty cart for that guest session
    assert len(res.json()["items"]) == 0
