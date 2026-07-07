import { create } from 'zustand';
import { fetchApi } from '@/services/api';
import { Product } from '@/types/product';

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  product: Product;
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (product_id: number) => Promise<void>;
  isInWishlist: (product_id: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    // Only fetch if we have a token (user is logged in)
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      set({ items: [] });
      return;
    }
    
    try {
      set({ isLoading: true });
      const items = await fetchApi('/wishlists');
      set({ items: items || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      set({ items: [], isLoading: false });
    }
  },

  toggleWishlist: async (product_id: number) => {
    // Requires login. If not logged in, we could redirect, but for now we might just fail.
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const { items, isInWishlist } = get();
    const isWished = isInWishlist(product_id);

    try {
      set({ isLoading: true });
      if (isWished) {
        await fetchApi(`/wishlists/${product_id}`, { method: 'DELETE' });
        set({ 
          items: items.filter(item => item.product_id !== product_id),
          isLoading: false 
        });
      } else {
        const newItem = await fetchApi('/wishlists/', {
          method: 'POST',
          body: JSON.stringify({ product_id })
        });
        
        // Refetch to get the fully populated product object, or optimistically append if backend returns it
        // Our backend returns the full object with product
        if (newItem && newItem.product) {
            set({ 
              items: [...items, newItem],
              isLoading: false 
            });
        } else {
            // fallback refetch
            await get().fetchWishlist();
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      set({ isLoading: false });
    }
  },

  isInWishlist: (product_id: number) => {
    return get().items.some(item => item.product_id === product_id);
  }
}));
