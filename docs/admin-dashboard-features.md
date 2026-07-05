# Admin Dashboard Features — Ravabazar

This document defines the suggested **Admin Dashboard MVP scope** for the Ravabazar custom e-commerce project.

The client has requested an “admin dashboard” but has not provided detailed functionality requirements. Therefore, agents must treat this as a controlled MVP scope and avoid overbuilding without explicit approval.

## Project Context

Ravabazar is a serious paid production e-commerce project.

The admin dashboard should act as the business control room for:

- Products
- Categories
- Inventory
- Orders
- Customers
- Payments
- Banners
- Store settings

The dashboard should be simple, reliable, and practical for real store operations.

Do not add advanced features unless explicitly requested later.

---

## Core Admin Dashboard Principle

The admin dashboard should answer these questions quickly:

- How many orders came today?
- How much sales happened today?
- Which orders are pending?
- Which products are low in stock?
- Which products are active/inactive?
- Which payments succeeded or failed?
- Which customers placed orders?
- What homepage banners/offers are currently active?

---

## MVP Admin Sidebar

Use this sidebar structure for version 1:

```text
Dashboard
Products
Categories
Inventory
Orders
Customers
Payments
Banners
Settings
```

Optional later items:

```text
Coupons
Reports
Staff
Audit Logs
Reviews
Notifications
```

---

## Admin Routes

Recommended frontend admin routes:

```text
/admin/login
/admin/dashboard
/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/categories
/admin/inventory
/admin/orders
/admin/orders/[id]
/admin/customers
/admin/payments
/admin/banners
/admin/settings
```

Optional future routes:

```text
/admin/coupons
/admin/reports
/admin/staff
/admin/audit-logs
/admin/reviews
/admin/notifications
```

---

# 1. Dashboard Overview

Route:

```text
/admin/dashboard
```

The main dashboard page should show high-level business stats.

## Required Cards

Show these summary cards:

```text
Total Orders
Today’s Orders
Total Sales
Today’s Sales
Pending Orders
Low Stock Products
Total Products
Total Customers
```

## Required Sections

The dashboard should include:

```text
Recent Orders
Low Stock Products
Payment Summary
Order Status Summary
```

## Notes

Keep this dashboard simple. It should help the admin understand the store status at a glance.

Do not build advanced analytics in v1.

---

# 2. Product Management

Routes:

```text
/admin/products
/admin/products/new
/admin/products/[id]/edit
```

Product management is a must-have admin feature.

## Admin should be able to:

```text
Add product
Edit product
Deactivate product
Upload product images
Set product name
Set product slug
Set description
Set price
Set sale price
Set SKU
Choose category
Set product status
Mark product as featured
```

## Product Statuses

Recommended product statuses:

```text
draft
active
inactive
out_of_stock
```

## Important Rules

Prefer deactivate/inactive over hard delete.

Do not hard delete products that may already exist in old orders.

SKU should be manual-first with auto-generation fallback.

Product images should not be stored permanently inside Docker containers. Use external storage later, such as Cloudinary or S3-compatible storage.

---

# 3. Category Management

Route:

```text
/admin/categories
```

## Admin should be able to:

```text
Add category
Edit category
Upload category image
Activate/deactivate category
Set category display order
```

## Category Fields

Recommended fields:

```text
name
slug
description
image_url
is_active
sort_order
```

## Notes

Categories are used for product browsing and filtering.

Example categories:

```text
Men
Women
Kids
Electronics
Grocery
New Arrivals
```

---

# 4. Inventory Management

Route:

```text
/admin/inventory
```

Inventory management is critical for e-commerce.

## Inventory table should show:

```text
Product name
SKU
Current stock
Reserved stock
Available stock
Low stock threshold
Stock status
Last updated
```

## Admin should be able to:

```text
Update stock quantity
Update low stock threshold
View low stock products
Search inventory by product name or SKU
```

## Formula

```text
available_stock = stock_quantity - reserved_quantity
```

## Important Rules

Do not reduce stock from the frontend.

Do not reduce stock when a user adds a product to cart.

Stock should be validated on the backend during checkout/order creation.

Stock should be reduced only through safe backend business logic during order/payment flow.

For MVP:

```text
One product has one SKU.
One product has one inventory record.
```

---

# 5. Order Management

Routes:

```text
/admin/orders
/admin/orders/[id]
```

Order management is the most important operational feature.

## Order List Should Show

```text
Order number
Customer name
Customer phone
Total amount
Payment status
Order status
Order date
Delivery city/pincode
```

## Filters

Admin should be able to filter orders by:

```text
Pending payment
Paid
Confirmed
Packed
Shipped
Out for delivery
Delivered
Cancelled
COD orders
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

## Order Detail Should Show

```text
Order number
Customer details
Shipping address snapshot
Ordered products
Product price snapshot
Quantity
Total amount
Payment details
Order status timeline
Admin notes if needed
```

## Important Rules

Store product snapshot in `order_items`.

Store address snapshot in `orders`.

Do not rely only on live product/address data after order creation.

Admin should be able to update order status safely.

---

# 6. Payment Status View

Route:

```text
/admin/payments
```

## Payment list should show:

```text
Order number
Payment provider
Payment method
Payment status
Amount
Provider payment ID
Provider order ID
Created date
```

## Payment Statuses

```text
pending
success
failed
refunded
partially_refunded
```

## Important Rules

Never mark payment successful from frontend only.

Always verify payment on backend.

Always verify payment webhook signatures.

For v1, full refund automation is optional. However, payment/refund records should be designed so refund support can be added later.

---

# 7. Customer List

Route:

```text
/admin/customers
```

## Customer list should show:

```text
Customer name
Phone
Email
Total orders
Last order date
Account status
Created date
```

## Customer detail page can later show:

```text
Saved addresses
Past orders
Payment history
```

## Notes

Do not overbuild CRM features in v1.

Customer management should mainly help the admin identify who ordered and view order history.

---

# 8. Banner / Homepage Management

Route:

```text
/admin/banners
```

Banner management allows the client to update homepage promotions without developer help.

## Admin should be able to manage:

```text
Homepage banners
Offer banners
Featured category sections
Featured products
```

## MVP Banner Fields

```text
title
image_url
link_url
is_active
sort_order
created_at
updated_at
```

## Notes

Keep banner management simple in v1.

Do not build a full page builder.

---

# 9. Store Settings

Route:

```text
/admin/settings
```

Settings prevent hardcoding business rules.

## Suggested Settings

```text
Store name
Store phone
Store email
Store WhatsApp number
Delivery charge
Free delivery above amount
COD enabled/disabled
Minimum order amount
Return window days
```

## Notes

Settings can be stored in a flexible `settings` table using key-value pairs.

Example:

```text
delivery_charge
free_delivery_above
cod_enabled
store_phone
store_email
return_window_days
```

---

# 10. Admin Authentication and Roles

Admin APIs and routes must be protected.

## Minimum roles

```text
customer
admin
super_admin
```

## Suggested Access

```text
super_admin = full access
admin = product/order/inventory/customer/payment management
customer = no admin access
```

For v1, role management can stay simple.

Do not build a complex permission matrix unless explicitly requested later.

---

# 11. Audit Logs

Audit logs are recommended for important admin actions.

## Track actions like:

```text
Admin created product
Admin updated product price
Admin changed stock quantity
Admin changed order status
Admin cancelled order
Admin changed settings
```

## Suggested Fields

```text
admin_user_id
action
entity_type
entity_id
old_value
new_value
created_at
```

Audit logs can be built after the core admin flows, but model planning should include it.

---

# 12. Features to Delay

Do not build these in v1 unless explicitly approved:

```text
Advanced analytics
GST invoice automation
Courier API integration
Warehouse management
Multi-vendor system
Staff permission matrix
Barcode scanner
Loyalty points
Wallet
Advanced coupon engine
Return pickup automation
Product reviews moderation
Bulk import/export
Complex report exports
```

These can be added in later phases.

---

# 13. Admin MVP Build Priority

Build the admin panel in this order:

```text
1. Admin login
2. Dashboard stats
3. Category management
4. Product management
5. Inventory management
6. Order management
7. Customer list
8. Payment status
9. Banner management
10. Store settings
```

Do not start with advanced dashboard charts.

Start with operational features first.

---

# 14. Suggested Client Scope Statement

Use this wording when confirming scope with the client:

```text
The admin dashboard will include product management, category management, inventory management, order management, customer list, payment status, banners, and basic store settings. Advanced reports, courier integration, staff permissions, and refund automation can be added in later phases if required.
```

This protects the project from uncontrolled scope creep.

---

# 15. Agent Instructions

When an AI agent or developer works on admin dashboard features:

```text
Read this file first.
Do not overbuild.
Do not add unrelated modules.
Keep v1 practical and stable.
Protect admin routes.
Use role-based authorization.
Keep admin API separate from public customer API.
Update docs when API or database changes.
Add tests for important backend behavior.
```

Admin dashboard goal:

```text
A reliable control panel that lets the client run the e-commerce store daily.
```
