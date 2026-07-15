'use client';

import { useState } from 'react';
import { fetchApi } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Phone, Lock, LogIn } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        setUser(response.user);

        // Merge guest cart if exists
        const guestSession = localStorage.getItem('guest_session');
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
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border shadow-xl shadow-black/5 rounded-3xl p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-center rounded-xl bg-destructive/15 text-destructive text-sm font-semibold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Phone Number</Label>
            <div className="relative flex items-center group">
              <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Phone className="w-5 h-5" />
              </div>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="9999999999" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Password</Label>
            <div className="relative flex items-center group">
              <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm font-medium text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
