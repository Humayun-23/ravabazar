'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect } from 'react';

export function Navbar() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const itemCount = useCartStore((state) =>
    state.cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
  );
  const { user } = useUserStore();
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Mobile Header (Kutuku Style) */}
        <div className="flex md:hidden items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-bold leading-tight line-clamp-1">
              Hi, {user?.first_name || 'Guest'}
            </span>
            <span className="text-xs text-muted-foreground">Let&apos;s go shopping</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              render={<Link href="/search" />}
              nativeButton={false}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleCart} className="relative h-8 w-8 rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Ravabazar</span>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            render={<Link href="/search" />}
            nativeButton={false}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            render={<Link href="/account" />}
            nativeButton={false}
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCart} className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
