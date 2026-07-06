import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.main import app
from app.models.products import Product, ProductStatus
from app.models.categories import Category
from app.models.inventory import Inventory
from app.models.product_images import ProductImage
from app.models.banners import Banner

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create tables
    Category.__table__.create(bind=engine)
    Product.__table__.create(bind=engine)
    Inventory.__table__.create(bind=engine)
    ProductImage.__table__.create(bind=engine)
    Banner.__table__.create(bind=engine)

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
        Banner.__table__.drop(bind=engine)
        ProductImage.__table__.drop(bind=engine)
        Inventory.__table__.drop(bind=engine)
        Product.__table__.drop(bind=engine)
        Category.__table__.drop(bind=engine)
        engine.dispose()

@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_catalog_endpoints(client, db_session):
    # Data Setup
    parent_cat = Category(name="Electronics", slug="electronics")
    db_session.add(parent_cat)
    db_session.commit()
    
    child_cat = Category(name="Phones", slug="phones", parent_id=parent_cat.id)
    db_session.add(child_cat)
    db_session.commit()

    prod1 = Product(
        name="Phone",
        slug="phone",
        sku="PHN-001",
        price=1000.0,
        status=ProductStatus.active,
        category_id=child_cat.id
    )
    db_session.add(prod1)
    db_session.commit()

    inv1 = Inventory(product_id=prod1.id, stock_quantity=10, reserved_quantity=2)
    db_session.add(inv1)
    
    img1 = ProductImage(product_id=prod1.id, image_url="http://example.com/phone1.jpg", is_primary=True)
    img2 = ProductImage(product_id=prod1.id, image_url="http://example.com/phone2.jpg", is_primary=False)
    db_session.add_all([img1, img2])

    banner1 = Banner(title="Sale", image_url="http://banner.com/1.jpg", position=1)
    db_session.add(banner1)
    db_session.commit()

    # 1. Test Categories
    res = client.get("/api/v1/categories/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["slug"] == "electronics"
    assert len(data[0]["children"]) == 1
    assert data[0]["children"][0]["slug"] == "phones"

    # 2. Test Products by Category Slug
    res = client.get("/api/v1/categories/phones/products")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "phone"

    # 3. Test Product Detail
    res = client.get("/api/v1/products/phone")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == "phone"
    assert data["available_stock"] == 8
    assert len(data["images"]) == 2

    # 4. Test Banners
    res = client.get("/api/v1/banners/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["position"] == 1
