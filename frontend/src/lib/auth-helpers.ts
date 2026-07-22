import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/services/api';

export function useAuthSuccess() {
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();

  const handleLoginSuccess = async (response: { access_token: string; refresh_token?: string; user: Record<string, unknown> }) => {
    localStorage.setItem('access_token', response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    setUser(response.user);

    // Merge guest cart if exists
    const guestSession = typeof window !== 'undefined' ? localStorage.getItem('guest_session') : null;
    if (guestSession) {
      try {
        await fetchApi('/cart/merge', {
          method: 'POST',
          body: JSON.stringify({ session_id: guestSession }),
        });
      } catch (e) {
        console.error('Failed to merge cart', e);
      }
    }

    router.push('/account');
  };

  return { handleLoginSuccess };
}
