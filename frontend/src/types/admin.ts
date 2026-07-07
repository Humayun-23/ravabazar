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
  total_users: number;
  total_orders: number;
  total_revenue: number;
  active_products: number;
}
