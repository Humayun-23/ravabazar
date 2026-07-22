'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, ChevronDown, Bell } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300 pt-[env(safe-area-inset-top)]">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Mobile Header (Design Style) */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium mb-0.5">Location</span>
            <div className="flex items-center gap-1 text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">New York, USA</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-muted/50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary"></span>
            </Button>
            <Link href="/account" className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Ravabazar</span>
          </Link>
          
          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 ml-8 text-sm font-semibold text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            <Link href="/products" className="transition-colors hover:text-foreground">Shop</Link>
            <Link href="/categories" className="transition-colors hover:text-foreground">Categories</Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
          </nav>
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
