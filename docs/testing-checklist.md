# Testing Checklist

## Backend Foundation

Automated:

* `GET /health` returns application liveness.
* `GET /api/v1/health` returns database health when the DB dependency succeeds.
* `GET /api/v1/health` reports degraded database health when the DB dependency fails.

Manual:

* `docker compose -f docker-compose.dev.yml up -d db backend`
* Open `http://localhost:8000/docs`
* Check `http://localhost:8000/health`
* Check `http://localhost:8000/api/v1/health`

## Checkout And Orders

Automated:

* `POST /api/v1/orders` requires a customer access token.
* `POST /api/v1/orders` requires `Idempotency-Key`.
* Checkout creates `address_snapshot` and order item product/price snapshots.
* Checkout validates active products and available stock.
* Checkout reserves stock through `inventory.reserved_quantity`.
* Checkout clears the customer cart after successful order creation.
* Repeating the same `Idempotency-Key` and body returns the existing order.
* Reusing the same `Idempotency-Key` with a different body returns conflict.
* `GET /api/v1/orders/my` lists only the current customer's orders.
* `GET /api/v1/orders/{id}` returns only the current customer's order.
* `POST /api/v1/orders/{id}/cancel` cancels cancellable orders and releases
  reserved stock.
