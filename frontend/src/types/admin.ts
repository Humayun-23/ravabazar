export interface Admin {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  admin: Admin;
}

export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  pending_orders: number;
  total_customers: number;
  low_stock_alerts: Array<{
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    reserved_quantity: number;
    available_stock: number;
  }>;
}

export interface Banner {
  id: number;
  title: string | null;
  image_url: string;
  redirect_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponListResponse {
  items: Coupon[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
