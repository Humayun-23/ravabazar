export interface User {
  id: number;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

export interface RegisterRequest {
  phone: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  phone?: string;
  email?: string;
  password?: string;
}
