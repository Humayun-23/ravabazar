import pytest
from pydantic import ValidationError

from app.schemas.inventory import InventoryCreate, InventoryUpdate
from app.schemas.products import ProductCreate, ProductStatus, ProductUpdate


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


def test_product_update_sku_uppercasing():
    product = ProductUpdate(sku="  update-sku-123  ")

    assert product.sku == "UPDATE-SKU-123"


def test_product_update_negative_sale_price_fails():
    with pytest.raises(ValidationError):
        ProductUpdate(sale_price=-1.0)


def test_product_status_accepts_defined_enum_values():
    product = ProductCreate(
        name="Test",
        slug="test",
        sku="SKU-1",
        price=5.0,
        status=ProductStatus.active,
    )

    assert product.status == ProductStatus.active


def test_inventory_negative_quantity_fails():
    with pytest.raises(ValidationError):
        InventoryCreate(
            product_id=1,
            stock_quantity=-10
        )


def test_inventory_update_negative_reserved_quantity_fails():
    with pytest.raises(ValidationError):
        InventoryUpdate(reserved_quantity=-1)


def test_inventory_available_stock_property():
    from app.models.inventory import Inventory
    
    inv = Inventory(product_id=1, stock_quantity=20, reserved_quantity=5)
    assert inv.available_stock == 15, "Available stock should be stock - reserved"
