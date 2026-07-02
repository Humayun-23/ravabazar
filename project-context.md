# Ravabazar Project Context

This is a serious production client project. The client has already paid an advance, so the project must be built carefully, professionally, and with minimum room for error.

## Project Name

Ravabazar

## Project Type

Custom e-commerce website + admin panel + backend API + Android app published to Play Store.

This project must NOT use WordPress or WooCommerce.

## Current Local Project Path

```text
/Users/humayun/ravabazar
```

## Repository Strategy

Use a monorepo.

Current monorepo structure:

```text
ravabazar/
├── frontend/
├── backend/
├── mobile/
├── docs/
├── docker-compose.dev.yml
├── README.md
└── .gitignore
```

Frontend and backend are in the same repository but will be deployed separately.

## Deployment Direction

Frontend:

```text
frontend/ → Vercel
```

Backend:

```text
backend/ → VPS using Docker
```

Database:

```text
PostgreSQL
```

Hosting provider is not finalized yet. The plan is to possibly partner with a local VPS provider. Do not assume a fixed production provider yet.

## Main Architecture

```text
Customer / Android TWA
        ↓
Next.js frontend on Vercel
        ↓
FastAPI backend API on VPS
        ↓
PostgreSQL database
        ↓
External image storage
```

The Android app should initially be a PWA/TWA wrapper around the same mobile-first frontend. Do not build a separate native Android app unless explicitly requested later.

## Tech Stack

Frontend:

```text
Next.js
TypeScript
Tailwind CSS
App Router
Admin panel inside same frontend under /admin
```

Backend:

```text
FastAPI
PostgreSQL
SQLAlchemy
Alembic
Pydantic Settings
JWT authentication
Docker
Docker Compose
```

Payments:

```text
Razorpay or Cashfree later
```

Image Storage:

```text
Cloudinary or S3-compatible storage later
```

Do not store uploaded product images permanently inside Docker containers.

## Current Project Status

The initial monorepo scaffolding has already been created.

Already created:

```text
frontend/
backend/
mobile/
docs/
```

Documentation files already created:

```text
docs/scope.md
docs/architecture.md
docs/database-plan.md
docs/api-contract.md
docs/deployment.md
docs/testing-checklist.md
docs/client-handover.md
```

Backend scaffold already includes:

```text
backend/app/
backend/app/api/v1/
backend/app/core/
backend/app/models/
backend/app/schemas/
backend/app/services/
backend/app/repositories/
backend/app/utils/
backend/alembic/
backend/tests/
backend/Dockerfile
backend/docker-compose.yml
backend/requirements.txt
backend/.env.example
```

API placeholder route files already exist for modules like:

```text
auth
users
addresses
categories
products
cart
orders
payments
uploads
admin
```

Docker Compose files are available for local backend/PostgreSQL workflows.

## Important Development Rule

Do not randomly redesign the architecture.

Do not destroy the existing scaffold.

Do not start building all features at once.

Build phase by phase.

Before modifying files, inspect the current folder structure and existing code.

## Development Phases

### Phase 1: Backend Foundation

Set up:

```text
FastAPI configuration
Pydantic settings
CORS
SQLAlchemy engine/session/Base
Database dependency
Alembic configuration
PostgreSQL Docker Compose
Health endpoints
Basic backend README
```

No business logic yet.

### Phase 2: Core Database Models

Create models and migrations for:

```text
users
addresses
categories
products
product_images
inventory
carts
cart_items
orders
order_items
payments
shipments
coupons
banners
settings
audit_logs
```

### Phase 3: Auth

Implement:

```text
customer register
customer login
admin login
JWT access tokens
password hashing
role-based authorization
current user dependency
```

Roles:

```text
customer
admin
super_admin
```

### Phase 4: Product and Category System

Implement:

```text
admin category CRUD
admin product CRUD
product images
inventory update
public product listing
public product detail
category pages
slug-based product URLs
```

### Phase 5: Cart and Checkout

Implement:

```text
cart
cart items
guest cart if needed
logged-in cart
address management
checkout validation
stock validation
```

### Phase 6: Orders

Implement:

```text
order creation
order item snapshots
address snapshot
admin order list
admin order detail
order status updates
customer order history
```

Important rule:

```text
Store product snapshot in order_items.
Store address snapshot in orders.
Do not rely only on live product/address data after order creation.
```

### Phase 7: Payments

Implement later:

```text
payment order creation
payment verification
payment webhook
payment failure handling
refund record
```

Important rule:

```text
Never trust frontend payment success alone.
Always verify payment on backend.
Always use webhook verification.
```

### Phase 8: Frontend Customer Website

Build:

```text
homepage
product listing
product detail
category pages
cart
checkout
login/register
account
my orders
legal pages
```

### Phase 9: Admin Panel

Build under:

```text
/frontend/src/app/admin
```

Admin features:

```text
dashboard
product management
category management
inventory management
order management
customer list
payment status
banner/settings management later
```

### Phase 10: Android App

Use:

```text
PWA + Trusted Web Activity
```

Do not build native Android app in v1 unless explicitly requested.

## Planned Frontend Routes

Customer routes:

```text
/
 /products
 /products/[slug]
 /categories/[slug]
 /cart
 /checkout
 /order-success
 /account
 /account/orders
 /account/orders/[id]
 /account/addresses
 /login
 /register
 /privacy-policy
 /terms-and-conditions
 /refund-policy
 /shipping-policy
 /contact
 /account-deletion
```

Admin routes:

```text
/admin/login
/admin/dashboard
/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/categories
/admin/orders
/admin/orders/[id]
/admin/inventory
/admin/customers
/admin/payments
/admin/coupons
/admin/banners
/admin/settings
```

## Planned Backend API Prefix

All backend APIs should use:

```text
/api/v1
```

Public APIs:

```text
GET    /api/v1/products
GET    /api/v1/products/{slug}
GET    /api/v1/categories
GET    /api/v1/categories/{slug}/products
GET    /api/v1/banners
```

Auth APIs:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

Cart APIs:

```text
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}
POST   /api/v1/cart/merge
```

Order APIs:

```text
POST   /api/v1/orders
GET    /api/v1/orders/my
GET    /api/v1/orders/{id}
POST   /api/v1/orders/{id}/cancel
```

Payment APIs:

```text
POST   /api/v1/payments/create-order
POST   /api/v1/payments/verify
POST   /api/v1/payments/webhook
```

Admin APIs:

```text
GET    /api/v1/admin/dashboard

POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/{id}
DELETE /api/v1/admin/products/{id}

POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/{id}

GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/{id}
PATCH  /api/v1/admin/orders/{id}/status

GET    /api/v1/admin/inventory
PATCH  /api/v1/admin/inventory/{product_id}

GET    /api/v1/admin/customers
GET    /api/v1/admin/payments
```

## Planned Database Tables

```text
users
addresses
categories
products
product_images
inventory
carts
cart_items
orders
order_items
payments
shipments
coupons
banners
settings
audit_logs
```

## Order Statuses

Online payment flow:

```text
pending_payment
paid
confirmed
packed
shipped
out_for_delivery
delivered
cancelled
failed
refunded
```

COD flow:

```text
cod_pending
confirmed
packed
shipped
out_for_delivery
delivered
cancelled
```

## Critical Business Logic Rules

Never reduce stock from the frontend.

Never mark payment successful from frontend only.

Always validate stock on the backend during checkout/order creation.

Use payment webhook verification.

Use address snapshot inside orders.

Use product snapshot inside order_items.

Use audit logs for important admin actions.

Do not expose PostgreSQL publicly.

Do not commit real `.env` files.

Use `.env.example` for documentation only.

Use role-based authorization for admin APIs.

Do not use wildcard CORS in production.

## Coding Style

Keep the project clean and simple.

Avoid over-engineering.

Use clear modules.

Do not create unnecessary abstractions.

Prefer readable production code over clever code.

Keep API logic separated into:

```text
routes/controllers
services
repositories
models
schemas
```

Frontend API calls should stay inside:

```text
frontend/src/services/
```

Do not put API calls directly inside UI components.

## Testing Priority

Important areas to test:

```text
auth
product CRUD
inventory update
cart
order creation
payment verification
payment webhook
admin authorization
order status updates
```

Minimum backend tests should be added as features are built.

## Security Rules

Never commit secrets.

Use strong JWT secret.

Hash passwords with bcrypt/passlib.

Use HTTPS in production.

Keep database private.

Validate all user inputs.

Protect admin routes.

Verify payment signatures.

Restrict CORS to allowed frontend domains in production.

## Current Immediate Next Step

Continue with Phase 1: Backend Foundation.

Implement only:

```text
Pydantic settings
database engine/session/Base
FastAPI app config
CORS
API router wiring
database health endpoint
Alembic wiring
Docker Compose backend + PostgreSQL local workflow
backend README updates
basic health tests
```

Do not implement product/order/payment/auth business logic yet.
