from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.addresses import AddressCreate
from app.schemas.admins import AdminCreate
from app.schemas.cart_items import CartItemAddRequest
from app.schemas.carts import CartMergeRequest
from app.schemas.categories import CategoryCreate
from app.schemas.coupons import CouponCreate
from app.schemas.order_items import OrderItemCreate
from app.schemas.orders import OrderCreate
from app.schemas.payments import PaymentCreate, PaymentCreateOrderRequest, PaymentVerifyRequest
from app.schemas.shipments import ShipmentCreate
from app.schemas.users import UserCreate


def test_user_schema_accepts_valid_email_and_phone():
    user = UserCreate(
        phone="9999999999",
        email="customer@example.com",
        password="password",
    )

    assert user.email == "customer@example.com"


def test_user_schema_rejects_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(
            phone="9999999999",
            email="not-an-email",
            password="password",
        )


def test_admin_schema_accepts_role_and_active_defaults():
    admin = AdminCreate(email="admin@example.com", password="password")

    assert admin.role == "manager"
    assert admin.is_active is True


def test_category_schema_supports_nested_parent_reference():
    category = CategoryCreate(name="Rice", slug="rice", parent_id=1)

    assert category.parent_id == 1


def test_address_schema_requires_address_snapshot_source_fields():
    address = AddressCreate(
        user_id=1,
        street_address="12 Market Road",
        city="Kolkata",
        state="West Bengal",
        postal_code="700001",
        country="India",
    )

    assert address.user_id == 1
    assert address.is_default is False


def test_cart_merge_schema_accepts_guest_session_id():
    cart = CartMergeRequest(session_id="guest-session")

    assert cart.session_id == "guest-session"


def test_cart_item_add_schema_defaults_quantity_to_one():
    item = CartItemAddRequest(product_id=2)

    assert item.product_id == 2
    assert item.quantity == 1


def test_order_schema_requires_address_snapshot_and_payment_method():
    order = OrderCreate(
        user_id=1,
        address_snapshot={
            "street_address": "12 Market Road",
            "city": "Kolkata",
            "state": "West Bengal",
            "postal_code": "700001",
            "country": "India",
        },
        total_amount=100.0,
        shipping_fee=10.0,
        tax=0.0,
        final_amount=110.0,
        payment_method="cod",
    )

    assert order.status == "pending_payment"
    assert order.address_snapshot["city"] == "Kolkata"


def test_order_item_schema_requires_product_snapshot():
    item = OrderItemCreate(
        order_id=1,
        product_id=None,
        product_name_snapshot="Rice",
        price_snapshot=100.0,
        quantity=2,
    )

    assert item.product_name_snapshot == "Rice"
    assert item.product_id is None


def test_payment_schema_defaults_to_pending():
    payment = PaymentCreate(order_id=1, provider="COD", amount=100.0)

    assert payment.status == "pending"


def test_payment_request_schemas_accept_provider_details():
    create_order = PaymentCreateOrderRequest(order_id=1, provider="razorpay")
    verify = PaymentVerifyRequest(
        order_id=1,
        provider="razorpay",
        provider_order_id="order_provider_123",
        provider_payment_id="pay_provider_123",
        signature="signature",
    )

    assert create_order.provider == "razorpay"
    assert verify.provider_payment_id == "pay_provider_123"


def test_shipment_schema_defaults_to_processing():
    shipment = ShipmentCreate(order_id=1)

    assert shipment.status == "processing"


def test_coupon_schema_accepts_validity_window():
    valid_from = datetime(2026, 7, 1)
    valid_until = datetime(2026, 7, 31)

    coupon = CouponCreate(
        code="SAVE10",
        discount_type="fixed",
        discount_value=10.0,
        valid_from=valid_from,
        valid_until=valid_until,
    )

    assert coupon.valid_from == valid_from
    assert coupon.valid_until == valid_until
