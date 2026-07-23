'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email address...' : 'Invalid or missing verification token.');

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        await fetchApi(`/auth/verify-email?token=${token}`, {
          method: 'POST',
        });
        if (isMounted) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now log in.');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(getErrorMessage(error, 'Verification failed. The link may be expired or invalid.'));
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="w-full max-w-md mx-auto text-center bg-card border shadow-xl shadow-black/5 rounded-3xl p-8 animate-in fade-in zoom-in-95">
      {status === 'loading' && (
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Verifying...</h2>
          <p className="text-muted-foreground font-medium">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Verified!</h2>
          <p className="text-muted-foreground font-medium mb-6">{message}</p>
          <Button 
            className="w-full h-12 rounded-xl text-base font-bold"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Continue to Login
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Verification Failed</h2>
          <p className="text-muted-foreground font-medium mb-6">{message}</p>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl text-base font-bold"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
