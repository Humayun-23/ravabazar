import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.coupons import Coupon
from app.models.products import Product
from app.models.inventory import Inventory
from app.models.users import User
from app.models.carts import Cart
from app.models.cart_items import CartItem
from app.models.addresses import Address

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
def test_user(db_session):
    user = User(
        email="test@example.com",
        hashed_password="hash",
        phone="1234567890"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture()
def test_token(test_user):
    return create_access_token(
        subject_id=test_user.id,
        subject_type="customer"
    )[0]

@pytest.fixture()
def test_setup(db_session, test_user):
    from app.models.categories import Category
    cat = Category(name="TestCat", slug="testcat")
    db_session.add(cat)
    db_session.commit()

    product = Product(
        category_id=cat.id,
        name="Test Product",
        slug="test-product",
        sku="TEST-SKU-1",
        description="A test product",
        price=100.0,
        status="active"
    )
    db_session.add(product)
    db_session.commit()
    
    inventory = Inventory(
        product_id=product.id,
        stock_quantity=10,
        reserved_quantity=0,
    )
    db_session.add(inventory)
    db_session.commit()
    
    address = Address(
        user_id=test_user.id,
        title="Home",
        street_address="123 Test St",
        city="Test City",
        state="Test State",
        postal_code="12345",
        country="Test Country"
    )
    db_session.add(address)
    db_session.commit()
    
    cart = Cart(user_id=test_user.id)
    db_session.add(cart)
    db_session.commit()
    
    cart_item = CartItem(
        cart_id=cart.id,
        product_id=product.id,
        quantity=2
    )
    db_session.add(cart_item)
    db_session.commit()
    
    return address.id

@pytest.fixture()
def valid_coupon(db_session):
    coupon = Coupon(
        code="SAVE20",
        discount_type="fixed",
        discount_value=20.0,
        min_order_value=50.0,
        is_active=True,
        usage_limit=10,
        usage_count=0
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon

@pytest.fixture()
def percentage_coupon(db_session):
    coupon = Coupon(
        code="HALF",
        discount_type="percentage",
        discount_value=50.0,
        min_order_value=10.0,
        is_active=True
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon

@pytest.fixture()
def expired_coupon(db_session):
    coupon = Coupon(
        code="EXPIRED",
        discount_type="fixed",
        discount_value=10.0,
        is_active=True,
        valid_until=datetime.utcnow() - timedelta(days=1)
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon

@pytest.fixture()
def inactive_coupon(db_session):
    coupon = Coupon(
        code="INACTIVE",
        discount_type="fixed",
        discount_value=10.0,
        is_active=False
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon

def test_checkout_valid_fixed_coupon(client, test_token, test_setup, valid_coupon):
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": valid_coupon.code
    }
    
    # 2 items * 100 = 200 total. fixed 20 discount. final = 180
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-1", **headers},
        json=payload
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_amount"] == 200.0
    assert data["discount_amount"] == 20.0
    assert data["coupon_code"] == "SAVE20"
    assert data["final_amount"] == 180.0

def test_checkout_valid_percentage_coupon(client, test_token, test_setup, percentage_coupon):
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": percentage_coupon.code
    }
    
    # 2 items * 100 = 200 total. 50% discount. final = 100
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-2", **headers},
        json=payload
    )
    assert res.status_code == 201
    data = res.json()
    assert data["discount_amount"] == 100.0
    assert data["final_amount"] == 100.0
    assert data["coupon_code"] == "HALF"

def test_checkout_expired_coupon(client, test_token, test_setup, expired_coupon):
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": expired_coupon.code
    }
    
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-3", **headers},
        json=payload
    )
    assert res.status_code == 400
    assert "expired" in res.json()["error"]["message"].lower()

def test_checkout_inactive_coupon(client, test_token, test_setup, inactive_coupon):
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": inactive_coupon.code
    }
    
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-4", **headers},
        json=payload
    )
    assert res.status_code == 400
    assert "active" in res.json()["error"]["message"].lower()

def test_checkout_min_order_value_unmet(client, test_token, test_setup, db_session):
    # Create a high min value coupon
    coupon = Coupon(
        code="HIGHMIN",
        discount_type="fixed",
        discount_value=10.0,
        min_order_value=500.0,
        is_active=True
    )
    db_session.add(coupon)
    db_session.commit()

    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": coupon.code
    }
    
    # 2 items * 100 = 200 total < 500 min order value
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-5", **headers},
        json=payload
    )
    assert res.status_code == 400
    assert "Minimum order value" in res.json()["error"]["message"]

def test_checkout_coupon_usage_limit(client, test_token, test_setup, db_session):
    # Create a coupon that is maxed out
    coupon = Coupon(
        code="MAXED",
        discount_type="fixed",
        discount_value=10.0,
        usage_limit=1,
        usage_count=1,
        is_active=True
    )
    db_session.add(coupon)
    db_session.commit()

    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "address_id": test_setup,
        "payment_method": "cashfree",
        "coupon_code": coupon.code
    }
    
    res = client.post(
        "/api/v1/orders",
        headers={"Idempotency-Key": "test-key-6", **headers},
        json=payload
    )
    assert res.status_code == 400
    assert "limit reached" in res.json()["error"]["message"].lower()
