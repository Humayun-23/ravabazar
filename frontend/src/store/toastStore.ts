import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  image_url?: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'success' | 'info' | 'error';
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({
      toasts: [...state.toasts.slice(-2), newToast], // Keep max 3 active
    }));

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
