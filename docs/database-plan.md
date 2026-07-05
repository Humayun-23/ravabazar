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
