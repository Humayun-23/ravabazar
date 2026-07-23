'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, authApi } from '@/services/api';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Phone, Lock, User, UserPlus, Mail } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { useAuthSuccess } from '@/lib/auth-helpers';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { handleLoginSuccess } = useAuthSuccess();
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const response = await authApi.googleLogin({ token: credentialResponse.credential });
      await handleLoginSuccess(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Phone number is required')) {
        setPendingGoogleToken(credentialResponse.credential);
        setError('Please provide your phone number to complete registration.');
      } else {
        setError(getErrorMessage(err, 'Failed to sign up with Google'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (pendingGoogleToken) {
        const response = await authApi.googleLogin({ token: pendingGoogleToken, phone: formData.phone });
        await handleLoginSuccess(response);
      } else {
        await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to register'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center bg-card border shadow-xl shadow-black/5 rounded-3xl p-8 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Registration Successful!</h2>
        <p className="text-muted-foreground font-medium">Please check your email inbox to verify your account.</p>
        <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border shadow-xl shadow-black/5 rounded-3xl p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an Account</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Join Ravabazar and start shopping
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-center rounded-xl bg-destructive/15 text-destructive text-sm font-semibold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {!pendingGoogleToken && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">First Name</Label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <Input 
                    id="first_name" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    disabled={loading}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Last Name</Label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <Input 
                    id="last_name" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    disabled={loading}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                  />
                </div>
              </div>
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
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                disabled={loading}
                className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
              />
            </div>
          </div>
          
          {!pendingGoogleToken && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                  />
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-2" disabled={loading}>
            {loading ? 'Processing...' : pendingGoogleToken ? 'Complete Registration' : 'Sign Up'}
          </Button>
        </form>

        {!pendingGoogleToken && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google Sign Up Failed');
                }}
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t text-center text-sm font-medium text-muted-foreground space-y-2">
          <div>
            Already have an account or want instant access?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign in with OTP / Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
