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
  coupon: any | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  calculateDiscount: (cartTotal: number) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  coupon: null,
  discountAmount: 0,
  
  setCart: (cart) => {
    set({ cart });
    if (cart) {
      get().calculateDiscount(cart.subtotal);
    }
  },
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

  calculateDiscount: (cartTotal: number) => {
    const { coupon } = get();
    if (!coupon) {
      set({ discountAmount: 0 });
      return;
    }
    
    if (cartTotal < coupon.min_order_value) {
      // automatically remove invalid coupon
      set({ coupon: null, discountAmount: 0 });
      return;
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = cartTotal * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    
    // Ensure discount doesn't exceed cart total
    discount = Math.min(discount, cartTotal);
    set({ discountAmount: discount });
  },

  applyCoupon: async (code: string) => {
    try {
      set({ isLoading: true });
      const couponRes = await fetchApi('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      
      const currentCart = get().cart;
      if (currentCart && currentCart.subtotal < couponRes.min_order_value) {
        throw new Error(`Minimum order value of $${couponRes.min_order_value} required`);
      }
      
      set({ coupon: couponRes, isLoading: false });
      if (currentCart) {
        get().calculateDiscount(currentCart.subtotal);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeCoupon: () => {
    set({ coupon: null, discountAmount: 0 });
  },

  fetchCart: async () => {
    get().initGuestSession();
    try {
      set({ isLoading: true });
      const cart = await fetchApi('/cart');
      get().setCart(cart);
      set({ isLoading: false });
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
      get().setCart(updatedCart);
      set({ isLoading: false });
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
      get().setCart(updatedCart);
      set({ isLoading: false });
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
