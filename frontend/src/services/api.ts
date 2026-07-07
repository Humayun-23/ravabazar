import { AdminAuthResponse, DashboardStats, AdminLoginCredentials } from '@/types/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const adminApi = {
  login: async (credentials: AdminLoginCredentials): Promise<AdminAuthResponse> => {
    return fetchApi('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  getDashboardStats: async (): Promise<DashboardStats> => {
    return fetchApi('/admin/dashboard/stats', {
      method: 'GET',
    });
  },

  getCategories: async () => {
    return fetchApi('/admin/categories', {
      method: 'GET',
    });
  },

  createCategory: async (data: any) => {
    return fetchApi('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProducts: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    const qs = searchParams.toString();
    return fetchApi(`/admin/products${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  createProduct: async (data: any) => {
    return fetchApi('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getOrders: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    const qs = searchParams.toString();
    return fetchApi(`/admin/orders${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  getOrderById: async (id: number) => {
    return fetchApi(`/admin/orders/${id}`, {
      method: 'GET',
    });
  },

  updateOrderStatus: async (id: number, status: string) => {
    return fetchApi(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  uploadImage: async (file: File, folder?: string): Promise<{ image_url: string; public_id: string; format: string; width: number; height: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }
    return fetchApi('/uploads/images', {
      method: 'POST',
      body: formData,
    });
  },
};

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const guestSession = typeof window !== 'undefined' ? localStorage.getItem('guest_session') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (guestSession) {
    headers['X-Cart-Session'] = guestSession;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API Request Failed: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
