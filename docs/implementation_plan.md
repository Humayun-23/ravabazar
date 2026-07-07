# Admin Panel Implementation Plan

This plan details the implementation steps to build the frontend Admin Panel for the Ravabazar ecommerce store, satisfying the remaining project scope.

## User Review Required

> [!IMPORTANT]
> The Admin side will have its own authentication state completely isolated from the customer state to prevent data leaks or privilege escalation.
> Please review this plan and click **Proceed** if you approve.

## Open Questions

> [!WARNING]
> 1. **Image Uploads**: When creating a product in the admin panel, we will need to upload images. The backend has an `/api/v1/uploads` endpoint. Should we implement a drag-and-drop zone for this?
> 2. **Design Approach**: Should the Admin Panel use the same `shadcn/ui` aesthetic but with a more dense, data-heavy layout (like a traditional dashboard side-nav)?

## Proposed Changes

We will divide the remaining work into two logical phases to maintain modularity.

### Phase 5: Admin Foundation & Catalog Management

This phase establishes the secure admin gateway and the core product/category management screens.

#### 1. Admin Authentication & State
- **[NEW] `src/store/adminStore.ts`**: A dedicated Zustand store for admin state.
- **[NEW] `src/app/admin/login/page.tsx`**: Admin login page hitting `POST /api/v1/admin/auth/login`.

#### 2. Admin Layout & Dashboard
- **[NEW] `src/app/admin/layout.tsx`**: A dashboard shell with a permanent sidebar (Dashboard, Products, Categories, Orders). Protected route logic—redirects to `/admin/login` if no admin token exists.
- **[NEW] `src/app/admin/page.tsx`**: The main dashboard overview fetching `GET /api/v1/admin/dashboard/stats`.

#### 3. Category Management
- **[NEW] `src/app/admin/categories/page.tsx`**: Table listing all categories.
- **[NEW] `src/app/admin/categories/new/page.tsx`**: Form to create a new category (`POST /api/v1/admin/categories`).

#### 4. Product Management
- **[NEW] `src/app/admin/products/page.tsx`**: Data table listing all products with pagination and stock indicators.
- **[NEW] `src/app/admin/products/new/page.tsx`**: Complex form to create a product (`POST /api/v1/admin/products`).
- **[NEW] `src/components/admin/ImageUpload.tsx`**: Component hitting `POST /api/v1/uploads` to handle product images.

---

### Phase 6: Admin Order Management & Final Polish

This phase wraps up the remaining admin capabilities and finalizes the customer legal pages.

#### 1. Order Management
- **[NEW] `src/app/admin/orders/page.tsx`**: Table listing all customer orders.
- **[NEW] `src/app/admin/orders/[id]/page.tsx`**: Detailed order view showing the JSON snapshot of the address and product names. Allows the admin to update the order status (`PATCH /api/v1/admin/orders/{id}/status`).

#### 2. Static Legal Pages
- **[NEW] `src/app/(customer)/privacy/page.tsx`**
- **[NEW] `src/app/(customer)/terms/page.tsx`**

## Verification Plan

### Automated Tests
- `npm run build` will be used to ensure all newly introduced Typescript interfaces map exactly to the backend schemas (e.g., `AdminAuthResponse`, `AdminProductCreate`).

### Manual Verification
- We will attempt to access `/admin` without logging in to verify the route protection.
- We will log in with the admin credentials seeded in the database (`admin@ravabazar.com`).
- We will create a new Category and a new Product, uploading a test image.
- We will verify that the new product immediately appears on the customer homepage.
- We will view the order we placed earlier in the admin order dashboard.
