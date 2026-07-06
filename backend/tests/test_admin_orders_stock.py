import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.orders import Order
from app.models.order_items import OrderItem
from app.models.products import Product
from app.models.inventory import Inventory

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
def test_order_with_stock(db_session):
    from app.models.categories import Category
    cat = Category(name="TestCat", slug="testcat")
    db_session.add(cat)
    db_session.commit()

    product = Product(
        category_id=cat.id,
        name="Test Product",
        slug="test-product",
        sku="TEST-SKU-123",
        description="A test product",
        price=10.0,
        status="active"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    inventory = Inventory(
        product_id=product.id,
        stock_quantity=10,
        reserved_quantity=2,  # 2 are reserved for the upcoming order
    )
    db_session.add(inventory)
    db_session.commit()

    from app.models.users import User
    user = User(
        email="test@example.com",
        hashed_password="hash",
        phone="1234567890"
    )
    db_session.add(user)
    db_session.commit()
    
    order = Order(
        user_id=user.id,
        address_snapshot={"city": "Test"},
        total_amount=20.0,
        final_amount=20.0,
        status="packed",
        payment_method="credit_card"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    
    order_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        product_name_snapshot=product.name,
        price_snapshot=product.price,
        quantity=2
    )
    db_session.add(order_item)
    db_session.commit()
    
    return order, product

def test_admin_order_stock_reduction_shipped(client: TestClient, db_session, test_admin_token, test_order_with_stock):
    order, product = test_order_with_stock
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    # Check initial stock
    db_session.refresh(product.inventory)
    assert product.inventory.stock_quantity == 10
    assert product.inventory.reserved_quantity == 2
    assert product.inventory.available_stock == 8
    
    # Transition to shipped
    payload = {"status": "shipped"}
    res = client.patch(f"/api/v1/admin/orders/{order.id}/status", headers=headers, json=payload)
    assert res.status_code == 200
    
    # Check updated stock
    db_session.refresh(product.inventory)
    assert product.inventory.stock_quantity == 8
    assert product.inventory.reserved_quantity == 0
    assert product.inventory.available_stock == 8

def test_admin_order_stock_release_cancelled(client: TestClient, db_session, test_admin_token, test_order_with_stock):
    order, product = test_order_with_stock
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    # Check initial stock
    db_session.refresh(product.inventory)
    assert product.inventory.stock_quantity == 10
    assert product.inventory.reserved_quantity == 2
    assert product.inventory.available_stock == 8
    
    # Transition to cancelled
    payload = {"status": "cancelled"}
    res = client.patch(f"/api/v1/admin/orders/{order.id}/status", headers=headers, json=payload)
    assert res.status_code == 200
    
    # Check updated stock
    db_session.refresh(product.inventory)
    assert product.inventory.stock_quantity == 10
    assert product.inventory.reserved_quantity == 0
    assert product.inventory.available_stock == 10
