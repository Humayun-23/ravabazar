from fastapi import APIRouter
from app.api.v1 import (
    health, auth, users, addresses, categories, products,
    cart, orders, payments, uploads, admin, banners,
    admin_products, admin_categories, admin_orders, admin_payments,
    admin_shipments, admin_users, admin_dashboard, admin_coupons,
    admin_banners, admin_settings, admin_inventory, shiprocket_webhooks,
    coupons, wishlists, notifications, product_reviews, admin_reviews
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_products.router, prefix="/admin/products", tags=["admin-products"])
api_router.include_router(admin_categories.router, prefix="/admin/categories", tags=["admin-categories"])
api_router.include_router(admin_orders.router, prefix="/admin/orders", tags=["admin-orders"])
api_router.include_router(admin_payments.router, prefix="/admin/payments", tags=["admin-payments"])
api_router.include_router(admin_shipments.router, prefix="/admin/shipments", tags=["admin-shipments"])
api_router.include_router(admin_users.router, prefix="/admin/customers", tags=["admin-customers"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["admin-dashboard"])
api_router.include_router(admin_coupons.router, prefix="/admin/coupons", tags=["admin-coupons"])
api_router.include_router(admin_banners.router, prefix="/admin/banners", tags=["admin-banners"])
api_router.include_router(admin_settings.router, prefix="/admin/settings", tags=["admin-settings"])
api_router.include_router(admin_inventory.router, prefix="/admin/inventory", tags=["admin-inventory"])
api_router.include_router(shiprocket_webhooks.router, prefix="/logistics", tags=["shiprocket"])
api_router.include_router(banners.router, prefix="/banners", tags=["banners"])
api_router.include_router(wishlists.router, prefix="/wishlists", tags=["wishlists"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(product_reviews.router)
api_router.include_router(admin_reviews.router)

