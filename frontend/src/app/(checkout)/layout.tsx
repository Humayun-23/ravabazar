import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter hover:text-primary transition-colors">
            Ravabazar
          </Link>
          <div className="flex items-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mr-2" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="py-8">
        {children}
      </main>

      <footer className="border-t py-8 bg-background mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ravabazar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
