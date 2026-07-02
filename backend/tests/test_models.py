from app.core.database import Base

from app.models import (
    Address,
    Admin,
    Banner,
    Cart,
    CartItem,
    Category,
    Coupon,
    Inventory,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductImage,
    Setting,
    Shipment,
    User,
)


EXPECTED_TABLES = {
    "addresses",
    "admins",
    "banners",
    "cart_items",
    "carts",
    "categories",
    "coupons",
    "inventory",
    "order_items",
    "orders",
    "payments",
    "product_images",
    "products",
    "settings",
    "shipments",
    "users",
}


def test_phase_two_models_are_registered_on_base_metadata():
    assert EXPECTED_TABLES.issubset(set(Base.metadata.tables.keys()))


def test_product_inventory_is_one_to_one():
    product_id_column = Inventory.__table__.c.product_id

    assert product_id_column.unique is True
    assert Product.inventory.property.uselist is False
    assert Inventory.product.property.back_populates == "inventory"


def test_order_keeps_required_address_snapshot():
    address_snapshot_column = Order.__table__.c.address_snapshot

    assert address_snapshot_column.nullable is False


def test_order_item_keeps_required_product_snapshot():
    product_name_column = OrderItem.__table__.c.product_name_snapshot
    price_column = OrderItem.__table__.c.price_snapshot

    assert product_name_column.nullable is False
    assert price_column.nullable is False
    assert OrderItem.__table__.c.product_id.nullable is True


def test_payment_and_shipment_are_one_to_one_with_order():
    assert Payment.__table__.c.order_id.unique is True
    assert Shipment.__table__.c.order_id.unique is True
    assert Order.payment.property.uselist is False
    assert Order.shipment.property.uselist is False


def test_core_unique_columns_are_declared():
    assert User.__table__.c.phone.unique is True
    assert Admin.__table__.c.email.unique is True
    assert Category.__table__.c.slug.unique is True
    assert Product.__table__.c.slug.unique is True
    assert Product.__table__.c.sku.unique is True
    assert Coupon.__table__.c.code.unique is True
    assert Setting.__table__.c.key.unique is True


def test_relationships_keep_child_records_owned_by_parent():
    assert "delete-orphan" in Product.images.property.cascade
    assert "delete-orphan" in Product.inventory.property.cascade
    assert "delete-orphan" in Cart.items.property.cascade
    assert "delete-orphan" in Order.items.property.cascade
    assert "delete-orphan" in User.addresses.property.cascade


def test_models_can_be_instantiated_with_minimum_required_values():
    user = User(phone="9999999999", hashed_password="hashed")
    category = Category(name="Grocery", slug="grocery")
    product = Product(name="Rice", slug="rice", sku="RICE-1", price=100.0)
    image = ProductImage(product=product, image_url="https://example.com/rice.jpg")
    inventory = Inventory(product=product, stock_quantity=10, reserved_quantity=2)
    cart = Cart(user=user)
    cart_item = CartItem(cart=cart, product=product, quantity=1)
    order = Order(
        user=user,
        address_snapshot={"city": "Kolkata"},
        total_amount=100.0,
        final_amount=100.0,
        payment_method="cod",
    )
    order_item = OrderItem(
        order=order,
        product=product,
        product_name_snapshot="Rice",
        price_snapshot=100.0,
        quantity=1,
    )
    payment = Payment(order=order, provider="COD", amount=100.0)
    shipment = Shipment(order=order)
    coupon = Coupon(code="SAVE10", discount_type="fixed", discount_value=10.0)
    banner = Banner(image_url="https://example.com/banner.jpg")
    setting = Setting(key="store_name", value="Ravabazar")
    admin = Admin(email="admin@example.com", hashed_password="hashed")

    assert inventory.available_stock == 8
    assert image.product is product
    assert cart_item.cart is cart
    assert order_item.order is order
    assert payment.order is order
    assert shipment.order is order
    assert coupon.code == "SAVE10"
    assert category.slug == "grocery"
    assert banner.image_url == "https://example.com/banner.jpg"
    assert setting.key == "store_name"
    assert admin.email == "admin@example.com"
