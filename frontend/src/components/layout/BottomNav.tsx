'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User, Store } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';

export function BottomNav() {
  const pathname = usePathname();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const itemCount = useCartStore((state) =>
    state.cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
  );

  const navItems = [
    { name: 'Home', href: '/', icon: Home, isButton: false },
    { name: 'Shop', href: '/products', icon: Store, isButton: false },
    { name: 'Cart', href: '#cart', icon: ShoppingBag, isButton: true, badge: itemCount },
    { name: 'Favorites', href: '/account/favorites', icon: Heart, isButton: false },
    { name: 'Account', href: '/account', icon: User, isButton: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40 bg-background/90 dark:bg-card/90 backdrop-blur-xl border border-border/60 rounded-full shadow-2xl p-1.5 transition-all duration-300">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = !item.isButton && (
            pathname === item.href || (
              item.href !== '/' &&
              pathname.startsWith(item.href) &&
              !navItems.some(
                (other) =>
                  !other.isButton &&
                  other.href !== item.href &&
                  other.href !== '/' &&
                  pathname.startsWith(other.href) &&
                  other.href.length > item.href.length
              )
            )
          );
          const Icon = item.icon;

          if (item.isButton) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={toggleCart}
                className="relative flex flex-col items-center justify-center p-2.5 rounded-full text-foreground/70 hover:text-foreground transition-all duration-200"
              >
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    key={item.badge}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground shadow-sm"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
                <span className="sr-only">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="sr-only">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
