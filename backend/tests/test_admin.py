import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.products import Product, ProductStatus
from app.models.product_images import ProductImage
from app.models.categories import Category
from app.models.inventory import Inventory
from app.models.admins import Admin
from app.models.product_reviews import ProductReview

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Admin.__table__.create(bind=engine)
    Category.__table__.create(bind=engine)
    Product.__table__.create(bind=engine)
    ProductImage.__table__.create(bind=engine)
    Inventory.__table__.create(bind=engine)

    ProductReview.__table__.create(bind=engine)

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
        ProductReview.__table__.drop(bind=engine)
        Inventory.__table__.drop(bind=engine)
        ProductImage.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
        Category.__table__.drop(bind=engine)
        Admin.__table__.drop(bind=engine)
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
def test_customer_token():
    return create_access_token(
        subject_id=1,
        subject_type="customer"
    )[0]

def test_admin_products_rbac(client: TestClient, test_customer_token):
    # Without token
    res = client.get("/api/v1/admin/products")
    assert res.status_code == 401
    
    # With customer token (should be rejected by get_current_admin)
    headers = {"Authorization": f"Bearer {test_customer_token}"}
    res = client.get("/api/v1/admin/products", headers=headers)
    assert res.status_code == 403

def test_admin_create_product(client: TestClient, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "name": "Admin Test Product",
        "sku": "ADM-001",
        "price": 100.0,
        "status": "draft",
        "inventory": {
            "stock_quantity": 50,
            "reserved_quantity": 0,
            "low_stock_threshold": 5
        },
        "images": [
            {
                "image_url": "https://example.com/adm1.png",
                "is_primary": True
            }
        ]
    }
    res = client.post("/api/v1/admin/products", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Admin Test Product"
    assert data["available_stock"] == 50
    assert data["sku"] == "ADM-001"
    
    # Update product
    update_payload = {
        "status": "active",
        "inventory": {
            "stock_quantity": 40
        }
    }
    res2 = client.patch(f"/api/v1/admin/products/{data['id']}", json=update_payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "active"
    assert res2.json()["available_stock"] == 40

    # Delete product
    res3 = client.delete(f"/api/v1/admin/products/{data['id']}", headers=headers)
    assert res3.status_code == 204
    
def test_admin_categories_rbac(client: TestClient, test_customer_token):
    res = client.get("/api/v1/admin/categories")
    assert res.status_code == 401
    
    headers = {"Authorization": f"Bearer {test_customer_token}"}
    res = client.get("/api/v1/admin/categories", headers=headers)
    assert res.status_code == 403

def test_admin_create_category(client: TestClient, test_admin_token):
    headers = {"Authorization": f"Bearer {test_admin_token}"}
    payload = {
        "name": "Admin Category",
        "slug": "admin-cat",
        "description": "Test admin category"
    }
    res = client.post("/api/v1/admin/categories", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Admin Category"
    
    # Update category
    res2 = client.patch(f"/api/v1/admin/categories/{data['id']}", json={"name": "Admin Category Updated"}, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["name"] == "Admin Category Updated"
