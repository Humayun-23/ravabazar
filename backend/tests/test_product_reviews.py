import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.models.product_reviews import ProductReview
from app.models.products import Product, ProductStatus
from app.models.users import User
from app.models.orders import Order
from app.models.admins import Admin
from app.models.order_items import OrderItem

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create tables
    User.__table__.create(bind=engine)
    Admin.__table__.create(bind=engine)
    Product.__table__.create(bind=engine)
    Order.__table__.create(bind=engine)
    OrderItem.__table__.create(bind=engine)
    ProductReview.__table__.create(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        ProductReview.__table__.drop(bind=engine)
        OrderItem.__table__.drop(bind=engine)
        Order.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
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

@pytest.fixture()
def test_user(db_session):
    user = User(
        phone="1234567890",
        email="test@example.com",
        first_name="Test",
        last_name="User",
        hashed_password="hashed_pw"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture()
def test_product(db_session):
    product = Product(
        name="Test Product",
        slug="test-product",
        sku="TEST-001",
        price=100.0,
        status=ProductStatus.active
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product

@pytest.fixture()
def test_order(db_session, test_user):
    order = Order(
        user_id=test_user.id,
        address_snapshot={"city": "Test"},
        total_amount=100.0,
        final_amount=100.0,
        status="delivered",
        payment_method="cod",
        idempotency_key="test-key-1",
        idempotency_request_hash="hash"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order

@pytest.fixture()
def customer_token_headers(test_user):
    token, _ = create_access_token(subject_id=test_user.id, subject_type="customer")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture()
def superadmin_token_headers(db_session):
    admin = Admin(
        email="superadmin@example.com",
        first_name="Admin",
        role="superadmin",
        hashed_password="hash"
    )
    db_session.add(admin)
    db_session.commit()
    token, _ = create_access_token(subject_id=admin.id, subject_type="admin")
    return {"Authorization": f"Bearer {token}"}


def test_add_product_review(client, customer_token_headers, db_session, test_product, test_user, test_order):
    order_item = OrderItem(
        order_id=test_order.id,
        product_id=test_product.id,
        product_name_snapshot="Test Product",
        price_snapshot=100.0,
        quantity=1
    )
    db_session.add(order_item)
    db_session.commit()
    
    data = {
        "rating": 5,
        "comment": "Excellent product!"
    }
    r = client.post(f"/api/v1/products/{test_product.id}/reviews", headers=customer_token_headers, json=data)
    assert r.status_code == 201
    assert r.json()["rating"] == 5
    assert r.json()["comment"] == "Excellent product!"
    
    r = client.post(f"/api/v1/products/{test_product.id}/reviews", headers=customer_token_headers, json=data)
    assert r.status_code == 409

    r = client.get(f"/api/v1/products/{test_product.id}/reviews")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1
    assert r.json()["items"][0]["rating"] == 5

def test_admin_delete_review(client, superadmin_token_headers, db_session, test_product, test_user):
    review = ProductReview(
        product_id=test_product.id,
        user_id=test_user.id,
        rating=4,
        comment="Good"
    )
    db_session.add(review)
    db_session.commit()
    
    review_id = review.id
    
    r = client.delete(f"/api/v1/admin/reviews/{review_id}", headers=superadmin_token_headers)
    assert r.status_code == 204
    
    r = client.get(f"/api/v1/products/{test_product.id}/reviews")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 0
