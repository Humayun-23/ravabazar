import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Admin, AdminAuthResponse } from '@/types/admin';

interface AdminStoreState {
  admin: Admin | null;
  token: string | null;
  setAdminAuth: (authData: AdminAuthResponse) => void;
  clearAdminAuth: () => void;
}

export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAdminAuth: (authData: AdminAuthResponse) => {
        set({
          admin: authData.admin,
          token: authData.access_token,
        });
      },
      clearAdminAuth: () => {
        set({ admin: null, token: null });
      },
    }),
    {
      name: 'ravabazar-admin-auth',
    }
  )
);
