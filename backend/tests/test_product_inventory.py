import pytest
from app.schemas.products import ProductCreate, ProductStatus
from app.schemas.inventory import InventoryCreate
from pydantic import ValidationError

def test_product_sku_uppercasing():
    product = ProductCreate(
        name="Test Product",
        slug="test-product",
        sku="  test-sku-123  ",
        price=10.0
    )
    assert product.sku == "TEST-SKU-123", "SKU should be trimmed and uppercased"

def test_product_negative_price_fails():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Test",
            slug="test",
            sku="SKU-1",
            price=-5.0
        )

def test_inventory_negative_quantity_fails():
    with pytest.raises(ValidationError):
        InventoryCreate(
            product_id=1,
            stock_quantity=-10
        )

def test_inventory_available_stock_property():
    from app.models.inventory import Inventory
    
    inv = Inventory(product_id=1, stock_quantity=20, reserved_quantity=5)
    assert inv.available_stock == 15, "Available stock should be stock - reserved"

