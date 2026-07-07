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

## Payments

Automated:

* `POST /api/v1/payments/create-order` requires a customer access token.
* `POST /api/v1/payments/create-order` only works for the current customer's
  `pending_payment` online order.
* Payment create-order responses use backend order totals, not frontend amounts.
* `POST /api/v1/payments/verify` rejects invalid signatures without marking an
  order paid.
* `POST /api/v1/payments/verify` marks payment verified and order paid only
  after valid signature verification.
* `POST /api/v1/payments/webhook` rejects invalid signatures.
* Valid webhooks are idempotent and can mark payment verified and order paid.
