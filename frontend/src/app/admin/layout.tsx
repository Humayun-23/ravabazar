'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/adminStore';
import { Button } from '@/components/ui/Button';

const ADMIN_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Products', href: '/admin/products', icon: '📦' },
  { name: 'Categories', href: '/admin/categories', icon: '🏷️' },
  { name: 'Orders', href: '/admin/orders', icon: '🛒' },
  { name: 'Customers', href: '/admin/customers', icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = useAdminStore((state) => state.admin);
  const token = useAdminStore((state) => state.token);
  const clearAdminAuth = useAdminStore((state) => state.clearAdminAuth);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [mounted, token, pathname, router]);

  // Don't render anything while checking auth to prevent flicker
  if (!mounted || (!token && pathname !== '/admin/login')) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r flex flex-col h-full flex-shrink-0 shadow-sm z-10">
        <div className="p-6 border-b">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">Admin Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {ADMIN_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <Button
                key={link.name}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start text-left h-11 ${
                  isActive ? '' : 'text-muted-foreground hover:text-foreground'
                }`}
                nativeButton={false}
                render={<Link href={link.href} />}
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                {link.name}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-muted/10">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{admin?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              clearAdminAuth();
              router.push('/admin/login');
            }}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
