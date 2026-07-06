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
from app.models.orders import Order
from app.models.products import Product
from app.models.categories import Category
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
def test_data(db_session):
    # Create User
    u = User(phone="111", email="test@example.com", hashed_password="pw")
    db_session.add(u)
    db_session.commit()
    
    # Create Orders
    o1 = Order(user_id=u.id, address_snapshot={}, total_amount=100.0, final_amount=100.0, status="paid", payment_method="cashfree")
    o2 = Order(user_id=u.id, address_snapshot={}, total_amount=50.0, final_amount=50.0, status="shipped", payment_method="cashfree")
    o3 = Order(user_id=u.id, address_snapshot={}, total_amount=200.0, final_amount=200.0, status="processing", payment_method="cashfree") # Counted as pending
    db_session.add_all([o1, o2, o3])
    db_session.commit()
    
    # Create Product + Inventory
    cat = Category(name="TestCat", slug="testcat")
    db_session.add(cat)
    db_session.commit()
    
    # Low stock product
    p1 = Product(category_id=cat.id, name="Low Stock Item", slug="low-stock", sku="LSI-1", price=10.0, status="active")
    db_session.add(p1)
    db_session.commit()
    i1 = Inventory(product_id=p1.id, stock_quantity=6, reserved_quantity=2) # Available = 4 (< 5 threshold)
    db_session.add(i1)
    
    # High stock product
    p2 = Product(category_id=cat.id, name="High Stock Item", slug="high-stock", sku="HSI-1", price=20.0, status="active")
    db_session.add(p2)
    db_session.commit()
    i2 = Inventory(product_id=p2.id, stock_quantity=10, reserved_quantity=0) # Available = 10
    db_session.add(i2)
    
    db_session.commit()

def test_admin_dashboard(client, test_admin_token, test_data):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    
    # Total sales = 100 + 50 + 200 = 350
    assert data["total_sales"] == 350.0
    
    # Total successful orders = 3
    assert data["total_orders"] == 3
    
    # Total pending orders = 1
    assert data["pending_orders"] == 1
    
    # Total customers = 1
    assert data["total_customers"] == 1
    
    # Low stock alerts
    assert len(data["low_stock_alerts"]) == 1
    assert data["low_stock_alerts"][0]["name"] == "Low Stock Item"
    assert data["low_stock_alerts"][0]["available_stock"] == 4
