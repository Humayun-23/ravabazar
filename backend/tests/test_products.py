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

def test_get_public_products(client, db_session):
    # Setup test data
    cat = Category(name="Electronics", slug="electronics")
    db_session.add(cat)
    db_session.commit()

    prod1 = Product(
        name="Phone",
        slug="phone",
        sku="PHN-001",
        price=1000.0,
        status=ProductStatus.active,
        category_id=cat.id,
        is_featured=True
    )
    prod2 = Product(
        name="Draft Phone",
        slug="draft-phone",
        sku="PHN-002",
        price=500.0,
        status=ProductStatus.draft,
        category_id=cat.id
    )
    prod3 = Product(
        name="Laptop",
        slug="laptop",
        sku="LPT-001",
        price=2000.0,
        status=ProductStatus.active,
        category_id=cat.id,
        is_featured=False
    )
    db_session.add_all([prod1, prod2, prod3])
    db_session.commit()

    # Add inventory
    inv1 = Inventory(product_id=prod1.id, stock_quantity=10, reserved_quantity=2)
    inv3 = Inventory(product_id=prod3.id, stock_quantity=5, reserved_quantity=0)
    db_session.add_all([inv1, inv3])
    
    # Add image
    img1 = ProductImage(product_id=prod1.id, image_url="http://example.com/phone.jpg", is_primary=True)
    db_session.add(img1)
    db_session.commit()

    # Test basic list
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2  # Only 2 active products
    assert data["items"][0]["available_stock"] == 5 or data["items"][1]["available_stock"] == 5 # Laptop
    
    # Test specific fields on Phone
    phone = next(p for p in data["items"] if p["slug"] == "phone")
    assert phone["available_stock"] == 8
    assert phone["category"]["slug"] == "electronics"
    assert phone["primary_image"]["image_url"] == "http://example.com/phone.jpg"
    assert phone["is_featured"] is True

    # Test search filtering
    response = client.get("/api/v1/products/?search=Laptop")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["slug"] == "laptop"

    # Test price filtering
    response = client.get("/api/v1/products/?min_price=1500")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["slug"] == "laptop"

    # Test featured filtering
    response = client.get("/api/v1/products/?is_featured=true")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["slug"] == "phone"
