import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.admins import Admin
from app.models.products import Product
from app.models.inventory import Inventory
from app.models.categories import Category

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
def test_inventory_data(db_session):
    c = Category(name="Cat", slug="cat", is_active=True)
    db_session.add(c)
    db_session.commit()
    
    p = Product(name="Prod1", slug="prod1", sku="SKU1", price=10, category_id=c.id)
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    
    inv = Inventory(product_id=p.id, stock_quantity=10, reserved_quantity=2, low_stock_threshold=5)
    db_session.add(inv)
    db_session.commit()
    return p, inv

def test_admin_inventory_list(client, test_admin_token, test_inventory_data):
    p, inv = test_inventory_data
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    res = client.get("/api/v1/admin/inventory", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1
    
    item = res.json()["items"][0]
    assert item["product_id"] == p.id
    assert item["sku"] == "SKU1"
    assert item["product_name"] == "Prod1"
    assert item["stock_quantity"] == 10
    assert item["reserved_quantity"] == 2
    assert item["available_stock"] == 8
    assert item["low_stock_threshold"] == 5

def test_admin_inventory_update(client, test_admin_token, test_inventory_data):
    p, inv = test_inventory_data
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    
    payload = {
        "stock_quantity": 20,
        "low_stock_threshold": 2
    }
    res = client.patch(f"/api/v1/admin/inventory/{p.id}", headers=headers, json=payload)
    assert res.status_code == 200
    assert res.json()["stock_quantity"] == 20
    assert res.json()["low_stock_threshold"] == 2
    assert res.json()["available_stock"] == 18
