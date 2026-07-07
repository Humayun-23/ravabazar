import { create } from 'zustand';
import { Cart } from '@/types/cart';
import { fetchApi } from '@/services/api';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  setCart: (cart: Cart | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  initGuestSession: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (product_id: number, quantity: number) => Promise<void>;
  updateCartItem: (item_id: number, quantity: number) => Promise<void>;
  removeCartItem: (item_id: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  
  setCart: (cart) => set({ cart }),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  
  initGuestSession: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const guestSession = localStorage.getItem('guest_session');
      if (!token && !guestSession) {
        localStorage.setItem('guest_session', crypto.randomUUID());
      }
    }
  },

  fetchCart: async () => {
    get().initGuestSession();
    try {
      set({ isLoading: true });
      const cart = await fetchApi('/cart');
      set({ cart, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ cart: null, isLoading: false });
    }
  },

  addToCart: async (product_id: number, quantity: number) => {
    get().initGuestSession();
    try {
      set({ isLoading: true });
      const updatedCart = await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id, quantity })
      });
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateCartItem: async (item_id: number, quantity: number) => {
    try {
      set({ isLoading: true });
      const updatedCart = await fetchApi(`/cart/items/${item_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      });
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeCartItem: async (item_id: number) => {
    try {
      set({ isLoading: true });
      await fetchApi(`/cart/items/${item_id}`, { method: 'DELETE' });
      // Remove returns 204 No Content, need to re-fetch cart
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
