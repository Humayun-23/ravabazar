# Ravabazar API Contract

This document is the implementation contract for the Ravabazar backend API.
All business APIs use the `/api/v1` prefix. Health endpoints outside `/api/v1`
exist for infrastructure checks.

Current implementation status: backend foundation and database schema are in
progress. Business endpoints below are the target contract for upcoming phases.

## Global Conventions

### Base URLs

```text
Local backend: http://localhost:8000
API prefix:    /api/v1
```

### Authentication

Protected customer endpoints require:

```http
Authorization: Bearer <customer_access_token>
```

Protected admin endpoints require:

```http
Authorization: Bearer <admin_access_token>
```

Customer and admin tokens are separate. A customer token must never authorize an
admin route, and an admin token must not be treated as a customer session.

### Standard Success Envelope

Single-resource responses may return the resource directly. List responses must
use this pagination envelope:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0,
  "total_pages": 0
}
```

### Standard Error Response

All handled errors should use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error message.",
    "details": {}
  }
}
```

Common status codes:

```text
400 Bad request
401 Missing or invalid token
403 Valid token without required permission
404 Resource not found
409 Conflict, usually duplicate unique data or invalid state transition
422 Validation error
500 Unexpected server error
```

### Common Query Parameters

```text
page: integer, default 1, minimum 1
page_size: integer, default 20, maximum 100
search: optional text search
sort: optional field name
order: asc | desc, default desc
```

### Shared Enums

Product status:

```text
draft
active
inactive
out_of_stock
```

Order status:

```text
pending_payment
paid
cod_pending
confirmed
packed
shipped
out_for_delivery
delivered
cancelled
failed
refunded
```

Payment status:

```text
pending
created
verified
failed
refunded
```

Payment provider:

```text
razorpay
cashfree
cod
```

Admin roles:

```text
admin
super_admin
manager
```

## Health

### `GET /health`

Public liveness endpoint. Does not check PostgreSQL.

Response `200`:

```json
{
  "status": "ok",
  "service": "Ravabazar API",
  "environment": "development"
}
```

### `GET /health/database`

Public infrastructure endpoint. Checks PostgreSQL with `SELECT 1`.

Response `200`:

```json
{
  "status": "ok",
  "service": "Ravabazar API",
  "environment": "development",
  "database": "ok"
}
```

### `GET /api/v1/health`

API-prefixed database health endpoint. Same response as `/health/database`.

## Authentication

### `POST /api/v1/auth/register`

Register a customer.

Request:

```json
{
  "phone": "9999999999",
  "email": "customer@example.com",
  "password": "strong-password",
  "first_name": "Asha",
  "last_name": "Khan"
}
```

Response `201`:

```json
{
  "id": 1,
  "phone": "9999999999",
  "email": "customer@example.com",
  "first_name": "Asha",
  "last_name": "Khan",
  "is_active": true,
  "created_at": "2026-07-02T00:00:00Z",
  "updated_at": "2026-07-02T00:00:00Z"
}
```

Rules:

```text
phone must be unique
password must be stored only as a bcrypt hash
```

### `POST /api/v1/auth/login`

Customer login.

Request:

```json
{
  "phone": "9999999999",
  "password": "strong-password"
}
```

Response `200`:

```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "phone": "9999999999",
    "email": "customer@example.com",
    "first_name": "Asha",
    "last_name": "Khan",
    "is_active": true
  }
}
```

### `POST /api/v1/auth/refresh`

Issue a new customer access token.

Request:

```json
{
  "refresh_token": "refresh-token"
}
```

Response `200`:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### `POST /api/v1/auth/logout`

Invalidate the current customer refresh token.

Response `204`: empty body.

### `GET /api/v1/auth/me`

Return the current authenticated customer.

Response `200`: same user shape as register response.

## Public Catalog

### `GET /api/v1/products`

List public active products.

Query parameters:

```text
page
page_size
search
category_slug
min_price
max_price
is_featured
sort = newest | price | name
order = asc | desc
```

Response `200`:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Basmati Rice",
      "slug": "basmati-rice",
      "sku": "RICE-001",
      "description": "Premium rice.",
      "price": 100.0,
      "sale_price": 90.0,
      "status": "active",
      "is_featured": true,
      "category": {
        "id": 1,
        "name": "Grocery",
        "slug": "grocery"
      },
      "primary_image": {
        "id": 1,
        "image_url": "https://cdn.example.com/rice.jpg",
        "alt_text": "Basmati Rice"
      },
      "available_stock": 8
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1,
  "total_pages": 1
}
```

Rules:

```text
Only products with status=active are returned.
available_stock is stock_quantity - reserved_quantity.
Stock is never changed by this endpoint.
```

### `GET /api/v1/products/{slug}`

Get public product detail by slug.

Response `200`:

```json
{
  "id": 1,
  "name": "Basmati Rice",
  "slug": "basmati-rice",
  "sku": "RICE-001",
  "description": "Premium rice.",
  "price": 100.0,
  "sale_price": 90.0,
  "status": "active",
  "is_featured": true,
  "category": {
    "id": 1,
    "name": "Grocery",
    "slug": "grocery"
  },
  "images": [
    {
      "id": 1,
      "image_url": "https://cdn.example.com/rice.jpg",
      "alt_text": "Basmati Rice",
      "is_primary": true
    }
  ],
  "available_stock": 8,
  "created_at": "2026-07-02T00:00:00Z",
  "updated_at": "2026-07-02T00:00:00Z"
}
```

### `GET /api/v1/categories`

List active categories with parent/child relationships.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Grocery",
    "slug": "grocery",
    "description": "Daily essentials",
    "parent_id": null,
    "is_active": true,
    "children": []
  }
]
```

### `GET /api/v1/categories/{slug}/products`

List active products inside a category.

Query parameters: same as `GET /api/v1/products`.

Response `200`: same envelope as product list.

### `GET /api/v1/banners`

List active public banners.

Response `200`:

```json
[
  {
    "id": 1,
    "title": "Launch Offer",
    "image_url": "https://cdn.example.com/banner.jpg",
    "redirect_url": "/products",
    "position": 1,
    "is_active": true
  }
]
```

## Customer Profile and Addresses

### `GET /api/v1/users/me`

Protected customer endpoint. Returns current profile.

Response `200`: same user shape as register response.

### `PATCH /api/v1/users/me`

Update current customer profile.

Request:

```json
{
  "email": "new@example.com",
  "first_name": "Asha",
  "last_name": "Khan"
}
```

Response `200`: updated user.

### `GET /api/v1/users/me/addresses`

List current customer's addresses.

Response `200`:

```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Home",
    "street_address": "12 Market Road",
    "city": "Kolkata",
    "state": "West Bengal",
    "postal_code": "700001",
    "country": "India",
    "is_default": true
  }
]
```

### `POST /api/v1/users/me/addresses`

Create address for current customer.

Request:

```json
{
  "title": "Home",
  "street_address": "12 Market Road",
  "city": "Kolkata",
  "state": "West Bengal",
  "postal_code": "700001",
  "country": "India",
  "is_default": true
}
```

Response `201`: created address.

### `PATCH /api/v1/users/me/addresses/{id}`

Update address owned by current customer.

Response `200`: updated address.

### `DELETE /api/v1/users/me/addresses/{id}`

Delete address owned by current customer.

Response `204`: empty body.

## Cart

Cart endpoints support authenticated customer carts and guest carts. Guest carts
must be identified by a session token supplied by the frontend.

Critical rule: adding to cart must never reduce stock.

### `GET /api/v1/cart`

Return current cart.

Headers:

```http
Authorization: Bearer <customer_access_token>
X-Cart-Session: <guest-session-id>
```

At least one of `Authorization` or `X-Cart-Session` is required.

Response `200`:

```json
{
  "id": 1,
  "user_id": 1,
  "session_id": null,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "name": "Basmati Rice",
        "slug": "basmati-rice",
        "price": 100.0,
        "sale_price": 90.0,
        "primary_image": {
          "image_url": "https://cdn.example.com/rice.jpg",
          "alt_text": "Basmati Rice"
        },
        "available_stock": 8
      },
      "line_total": 180.0
    }
  ],
  "subtotal": 180.0
}
```

### `POST /api/v1/cart/items`

Add item to cart.

Request:

```json
{
  "product_id": 1,
  "quantity": 2
}
```

Response `200`: updated cart.

Rules:

```text
quantity must be greater than 0
quantity must be less than or equal to 10 per product
product must be active
requested quantity must not exceed available_stock
inventory is not reduced
```

### `PATCH /api/v1/cart/items/{id}`

Update cart item quantity.

Request:

```json
{
  "quantity": 3
}
```

Response `200`: updated cart.

Rules:

```text
quantity must be greater than 0
quantity must be less than or equal to 10 per product
requested quantity must not exceed available_stock
inventory is not reduced
```

### `DELETE /api/v1/cart/items/{id}`

Remove item from cart.

Response `204`: empty body.

### `POST /api/v1/cart/merge`

Merge guest cart into authenticated customer cart after login.

Request:

```json
{
  "session_id": "guest-session-id"
}
```

Response `200`: merged customer cart.

## Orders

Critical rules:

```text
Stock validation happens only on the backend.
Order creation stores address_snapshot on orders.
Order creation stores product_name_snapshot and price_snapshot on order_items.
Frontend must never reduce stock.
```

### `POST /api/v1/orders`

Create an order from the current cart.

Headers:

```http
Idempotency-Key: <unique-client-generated-key>
```

`Idempotency-Key` is required. Repeating the same key for the same customer and
same request body must return the original order response instead of creating a
second order.

Request:

```json
{
  "address_id": 1,
  "payment_method": "razorpay",
  "coupon_code": "SAVE10"
}
```

Response `201`:

```json
{
  "id": 1,
  "user_id": 1,
  "address_snapshot": {
    "title": "Home",
    "street_address": "12 Market Road",
    "city": "Kolkata",
    "state": "West Bengal",
    "postal_code": "700001",
    "country": "India"
  },
  "total_amount": 180.0,
  "shipping_fee": 0.0,
  "tax": 0.0,
  "final_amount": 180.0,
  "status": "pending_payment",
  "payment_method": "razorpay",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name_snapshot": "Basmati Rice",
      "price_snapshot": 90.0,
      "quantity": 2
    }
  ],
  "payment": null,
  "shipment": null,
  "created_at": "2026-07-02T00:00:00Z",
  "updated_at": "2026-07-02T00:00:00Z"
}
```

Rules:

```text
Require Idempotency-Key.
Validate cart is not empty.
Validate every product is active.
Validate available stock for every item.
For online payment, set status=pending_payment.
For COD, set status=cod_pending.
Do not mark online payment as paid here.
Do not create duplicate orders when the same Idempotency-Key is retried.
```

### `GET /api/v1/orders/my`

List current customer's orders.

Response `200`: paginated order summary envelope.

### `GET /api/v1/orders/{id}`

Get current customer's order detail.

Response `200`: order detail.

### `POST /api/v1/orders/{id}/cancel`

Cancel current customer's cancellable order.

Request:

```json
{
  "reason": "Ordered by mistake"
}
```

Response `200`: updated order.

Rules:

```text
Delivered orders cannot be cancelled.
Cancellation must not be allowed for another customer's order.
If stock was reserved, release reserved stock.
```

## Payments

Critical rules:

```text
Never trust frontend payment success.
Always verify payment on backend.
Always verify webhook signatures.
Use provider-specific verification for Razorpay or Cashfree.
```

### `POST /api/v1/payments/create-order`

Create payment order with provider for an existing pending order.

Request:

```json
{
  "order_id": 1,
  "provider": "razorpay"
}
```

Response `201`:

```json
{
  "id": 1,
  "order_id": 1,
  "provider": "razorpay",
  "provider_order_id": "order_provider_123",
  "amount": 180.0,
  "status": "created",
  "client_payload": {
    "key": "public-provider-key",
    "order_id": "order_provider_123",
    "amount": 18000,
    "currency": "INR"
  }
}
```

Rules:

```text
Order must belong to current customer.
Order status must be pending_payment.
Amount must be calculated from backend order totals.
```

### `POST /api/v1/payments/verify`

Verify frontend-returned payment details with provider.

Request for Razorpay:

```json
{
  "order_id": 1,
  "provider": "razorpay",
  "provider_order_id": "order_provider_123",
  "provider_payment_id": "pay_provider_123",
  "signature": "signature"
}
```

Response `200`:

```json
{
  "payment_id": 1,
  "order_id": 1,
  "status": "verified",
  "order_status": "paid"
}
```

Rules:

```text
Backend must verify provider signature before marking payment verified.
Frontend response alone must never mark an order paid.
Successful verification may mark order paid, but webhook must still be supported.
```

### `POST /api/v1/payments/webhook`

Provider webhook endpoint. Public but signature-protected.

Headers:

```http
X-Razorpay-Signature: <signature>
X-Cashfree-Signature: <signature>
```

Response `200`:

```json
{
  "received": true
}
```

Rules:

```text
Reject invalid signatures.
Webhook processing must be idempotent.
On successful payment, update payment status and order status.
On failure, update payment status and order status to failed where appropriate.
Do not trust unauthenticated payload fields.
```

## Admin Authentication

### `POST /api/v1/admin/auth/login`

Admin login.

Request:

```json
{
  "email": "admin@example.com",
  "password": "strong-password"
}
```

Response `200`:

```json
{
  "access_token": "admin-jwt-token",
  "refresh_token": "admin-refresh-token",
  "token_type": "bearer",
  "expires_in": 1800,
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true
  }
}
```

### `POST /api/v1/admin/auth/refresh`

Issue a new admin access token.

Request:

```json
{
  "refresh_token": "admin-refresh-token"
}
```

Response `200`:

```json
{
  "access_token": "admin-jwt-token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

Rules:

```text
Only admin refresh tokens are accepted.
Customer refresh tokens must be rejected.
Inactive admins must be rejected.
```

## Admin Dashboard

All admin endpoints require an admin token. Mutating routes require `admin` or
`super_admin` unless a later RBAC policy explicitly allows more roles.

### `GET /api/v1/admin/dashboard`

Response `200`:

```json
{
  "orders_today": 10,
  "revenue_today": 5000.0,
  "pending_orders": 3,
  "low_stock_products": 4,
  "total_customers": 100
}
```

## Admin Products and Categories

### `GET /api/v1/admin/products`

List all products, including draft and inactive.

Query parameters:

```text
page
page_size
search
category_id
status
is_featured
```

Response `200`: paginated product envelope.

### `GET /api/v1/admin/products/{id}`

Get product detail for admin editing.

Response `200`: product detail including inventory and images.

### `POST /api/v1/admin/products`

Create product.

Request:

```json
{
  "name": "Basmati Rice",
  "slug": "basmati-rice",
  "sku": "RICE-001",
  "description": "Premium rice.",
  "price": 100.0,
  "sale_price": 90.0,
  "category_id": 1,
  "status": "draft",
  "is_featured": false,
  "inventory": {
    "stock_quantity": 10,
    "reserved_quantity": 0,
    "low_stock_threshold": 5
  },
  "images": [
    {
      "image_url": "https://cdn.example.com/rice.jpg",
      "alt_text": "Basmati Rice",
      "is_primary": true
    }
  ]
}
```

Response `201`: product detail.

Rules:

```text
sku must be trimmed and uppercased.
sku and slug must be unique.
price and sale_price must be >= 0.
Images must use external storage URLs, not permanent Docker container paths.
```

### `PATCH /api/v1/admin/products/{id}`

Update product fields.

Response `200`: product detail.

### `DELETE /api/v1/admin/products/{id}`

Delete or deactivate a product.

Response `204`: empty body.

Recommended behavior for MVP: soft-deactivate by setting `status=inactive`
unless hard delete is explicitly required.

### `POST /api/v1/admin/categories`

Create category.

Request:

```json
{
  "name": "Grocery",
  "slug": "grocery",
  "description": "Daily essentials",
  "parent_id": null,
  "is_active": true
}
```

Response `201`: category.

### `GET /api/v1/admin/categories`

List categories for admin management.

Response `200`: category list with parent/child fields.

### `GET /api/v1/admin/categories/{id}`

Get category detail for admin editing.

Response `200`: category.

### `PATCH /api/v1/admin/categories/{id}`

Update category.

Response `200`: category.

## Admin Coupons

Coupon APIs are admin-only. Public coupon validation should happen during order
creation, not through a separate public trust boundary.

### `GET /api/v1/admin/coupons`

List coupons.

Response `200`: paginated coupon envelope.

### `POST /api/v1/admin/coupons`

Create coupon.

Request:

```json
{
  "code": "SAVE10",
  "discount_type": "fixed",
  "discount_value": 10.0,
  "min_order_value": 100.0,
  "valid_from": "2026-07-02T00:00:00Z",
  "valid_until": "2026-07-31T23:59:59Z",
  "usage_limit": 100,
  "is_active": true
}
```

Response `201`: coupon.

### `PATCH /api/v1/admin/coupons/{id}`

Update coupon.

Response `200`: coupon.

## Admin Banners and Settings

### `GET /api/v1/admin/banners`

List banners.

Response `200`: banner list.

### `POST /api/v1/admin/banners`

Create banner.

Request:

```json
{
  "title": "Launch Offer",
  "image_url": "https://cdn.example.com/banner.jpg",
  "redirect_url": "/products",
  "position": 1,
  "is_active": true
}
```

Response `201`: banner.

### `PATCH /api/v1/admin/banners/{id}`

Update banner.

Response `200`: banner.

### `GET /api/v1/admin/settings`

List application settings.

Response `200`:

```json
[
  {
    "id": 1,
    "key": "store_name",
    "value": "Ravabazar",
    "description": "Public store name"
  }
]
```

### `PATCH /api/v1/admin/settings/{key}`

Update application setting by key.

Request:

```json
{
  "value": "Ravabazar",
  "description": "Public store name"
}
```

Response `200`: setting.

## Admin Inventory

### `GET /api/v1/admin/inventory`

List inventory across products.

Response `200`:

```json
{
  "items": [
    {
      "product_id": 1,
      "sku": "RICE-001",
      "product_name": "Basmati Rice",
      "stock_quantity": 10,
      "reserved_quantity": 2,
      "available_stock": 8,
      "low_stock_threshold": 5
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1,
  "total_pages": 1
}
```

### `PATCH /api/v1/admin/inventory/{product_id}`

Update inventory.

Request:

```json
{
  "stock_quantity": 20,
  "low_stock_threshold": 5
}
```

Response `200`: inventory row.

Rules:

```text
stock_quantity, reserved_quantity, and low_stock_threshold must be >= 0.
Admin inventory changes must be audit logged once audit logs are implemented.
```

## Admin Orders

### `GET /api/v1/admin/orders`

List all orders.

Query parameters:

```text
page
page_size
status
payment_method
customer_id
date_from
date_to
```

Response `200`: paginated order summary envelope.

### `GET /api/v1/admin/orders/{id}`

Get full order detail.

Response `200`: order detail.

### `PATCH /api/v1/admin/orders/{id}/status`

Update fulfillment status.

Request:

```json
{
  "status": "packed",
  "note": "Packed by warehouse"
}
```

Response `200`: updated order.

Rules:

```text
Only valid status transitions are allowed.
Payment status must not be marked successful from this endpoint.
Status changes must be audit logged once audit logs are implemented.
```

## Admin Customers and Payments

### `GET /api/v1/admin/customers`

List customers.

Response `200`: paginated customer envelope.

### `GET /api/v1/admin/payments`

List payments.

Query parameters:

```text
page
page_size
provider
status
order_id
```

Response `200`: paginated payment envelope.

## Uploads

Uploads are planned for product/admin media only. Product images must not be
stored permanently inside Docker containers.

### `POST /api/v1/uploads/images`

Protected admin endpoint for uploading product images to external storage.

Request: `multipart/form-data`

```text
file: image file
folder: optional folder/category
```

Response `201`:

```json
{
  "image_url": "https://cdn.example.com/products/rice.jpg",
  "provider": "cloudinary"
}
```

## Backend Safety Rules

```text
Never reduce stock from frontend actions.
Never mark payment successful from frontend only.
Always verify payment on backend and with webhook support.
Store product snapshots in order_items.
Store address snapshots in orders.
Protect admin APIs with role-based authorization.
Do not expose PostgreSQL publicly.
Do not store product images permanently inside Docker containers.
```
