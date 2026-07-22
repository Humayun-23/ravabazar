'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Order', href: '/account/orders', icon: ShoppingBag },
    { name: 'Favorite', href: '/account/favorites', icon: Heart },
    { name: 'Settings', href: '/account', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40 bg-primary rounded-[2rem] shadow-2xl p-2 transition-all duration-300">
      <div className="flex justify-between items-center px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (
            item.href !== '/' && 
            pathname.startsWith(item.href) && 
            !navItems.some(other => other.href !== item.href && other.href !== '/' && pathname.startsWith(other.href) && other.href.length > item.href.length)
          );
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
                isActive ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/70 hover:text-primary-foreground'
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
