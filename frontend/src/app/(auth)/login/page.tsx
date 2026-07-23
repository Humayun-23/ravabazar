'use client';

import { useState, useEffect } from 'react';
import { fetchApi, authApi } from '@/services/api';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Phone, Lock, LogIn, KeyRound, Edit2, RotateCw, Smartphone } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { useAuthSuccess } from '@/lib/auth-helpers';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { handleLoginSuccess } = useAuthSuccess();
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await authApi.googleLogin({ token: credentialResponse.credential });
      await handleLoginSuccess(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Phone number is required')) {
        setPendingGoogleToken(credentialResponse.credential);
        setError('Please provide your phone number to complete registration.');
      } else {
        setError(getErrorMessage(err, 'Failed to login with Google'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await authApi.requestOtp(cleanPhone);
      setOtpSent(true);
      setResendTimer(30);
      setSuccessMsg('OTP code sent successfully to your mobile number.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter a valid OTP code.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await authApi.verifyOtp({ phone: cleanPhone, otp: cleanOtp });
      await handleLoginSuccess(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired OTP code'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (pendingGoogleToken) {
        const response = await authApi.googleLogin({ token: pendingGoogleToken, phone });
        await handleLoginSuccess(response);
      } else {
        const response = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ phone, password }),
        });
        await handleLoginSuccess(response);
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Sign in to your account to continue
          </p>
        </div>

        {!pendingGoogleToken && (
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'otp'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              OTP Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'password'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-4 h-4" />
              Password
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 mb-5 text-center rounded-xl bg-destructive/15 text-destructive text-sm font-semibold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-5 text-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
            {successMsg}
          </div>
        )}

        {/* OTP LOGIN FLOW */}
        {!pendingGoogleToken && authMethod === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                    Phone Number
                  </Label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <Input
                      id="otp-phone"
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

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-2"
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send OTP Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="p-3 bg-muted/50 rounded-xl flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>OTP sent to <strong className="text-foreground">{phone}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp-code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                    Enter Verification Code
                  </Label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <Input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={10}
                      required
                      disabled={loading}
                      className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base font-mono tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground font-medium">Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="font-bold text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-2"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* PASSWORD / GOOGLE COMPLETE REGISTRATION FLOW */}
        {(pendingGoogleToken || authMethod === 'password') && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
            
            {!pendingGoogleToken && (
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
            )}

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-2" disabled={loading}>
              {loading ? 'Processing...' : pendingGoogleToken ? 'Complete Registration' : 'Sign In'}
            </Button>
          </form>
        )}

        {!pendingGoogleToken && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google Login Failed');
                }}
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>
          </>
        )}

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

