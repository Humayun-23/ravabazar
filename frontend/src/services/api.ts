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
    return fetchApi('/admin/dashboard', {
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

  getProductById: async (id: number) => {
    return fetchApi(`/admin/products/${id}`, {
      method: 'GET',
    });
  },

  createProduct: async (data: any) => {
    return fetchApi('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id: number, data: any) => {
    return fetchApi(`/admin/products/${id}`, {
      method: 'PATCH',
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

  getCustomers: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    const qs = searchParams.toString();
    return fetchApi(`/admin/customers${qs ? `?${qs}` : ''}`, {
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

  getBanners: async () => {
    return fetchApi('/admin/banners', {
      method: 'GET',
    });
  },

  createBanner: async (data: any) => {
    return fetchApi('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBanner: async (id: number, data: any) => {
    return fetchApi(`/admin/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteBanner: async (id: number) => {
    return fetchApi(`/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  getCoupons: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    const qs = searchParams.toString();
    return fetchApi(`/admin/coupons${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  createCoupon: async (data: any) => {
    return fetchApi('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCoupon: async (id: number, data: any) => {
    return fetchApi(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = null;
  const guestSession = typeof window !== 'undefined' ? localStorage.getItem('guest_session') : null;

  if (typeof window !== 'undefined') {
    if (endpoint.startsWith('/admin')) {
      // Get token from admin Zustand store
      try {
        const adminAuthStr = localStorage.getItem('ravabazar-admin-auth');
        if (adminAuthStr) {
          const adminAuth = JSON.parse(adminAuthStr);
          token = adminAuth?.state?.token || null;
        }
      } catch (e) {
        console.error('Failed to parse admin auth', e);
      }
    } else {
      // Get token for regular customer
      token = localStorage.getItem('access_token');
    }
  }

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
    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (endpoint.startsWith('/admin')) {
        localStorage.removeItem('ravabazar-admin-auth');
        window.location.href = '/admin/login';
      } else {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              localStorage.setItem('access_token', data.access_token);
              // Retry original request with new token
              const newHeaders = { ...headers, 'Authorization': `Bearer ${data.access_token}` };
              const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: newHeaders,
              });
              
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                const errorMessage = errorData?.detail || errorData?.error?.message || `API Request Failed: ${retryResponse.statusText}`;
                throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
              }
              if (retryResponse.status === 204) return null;
              return retryResponse.json();
            } else {
              throw new Error('Refresh failed');
            }
          } catch (e) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return;
          }
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.detail || errorData?.error?.message || `API Request Failed: ${response.statusText}`;
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
