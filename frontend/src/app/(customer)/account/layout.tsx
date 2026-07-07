'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { User, MapPin, Package, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Profile', href: '/account', icon: User },
  { name: 'Addresses', href: '/account/addresses', icon: MapPin },
  { name: 'Orders', href: '/account/orders', icon: Package },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useUserStore();

  useEffect(() => {
    // Basic client-side protection (real protection should also happen in middleware or components that fetch)
    const token = localStorage.getItem('access_token');
    if (!token && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
    return null; // Don't render until redirect
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Account</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
