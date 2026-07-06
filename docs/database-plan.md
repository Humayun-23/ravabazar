# Database Plan

Planned tables:
* users
* addresses
* categories
* products
* product_images
* inventory
* carts
* cart_items
* orders
* order_items
* payments
* shipments
* coupons
* banners
* settings
* audit_logs

## Notes
- **SKU** is stored on `products`.
- **Inventory** is stored in a separate `inventory` table.
- One product has one inventory record in MVP.
- `available_stock = stock_quantity - reserved_quantity` (not stored, calculated dynamically).
- Checkout reserves stock by increasing `inventory.reserved_quantity`; it does not
  reduce `inventory.stock_quantity`.
- `orders` stores `address_snapshot`, `idempotency_key`, and
  `idempotency_request_hash` so checkout retries are safe.
- `order_items` stores `product_name_snapshot` and `price_snapshot` so order
  history does not change when catalog data changes later.
- Customer carts are unique per non-null `user_id`; guest carts are unique per
  non-null `session_id`; cart items are unique by `(cart_id, product_id)`.
