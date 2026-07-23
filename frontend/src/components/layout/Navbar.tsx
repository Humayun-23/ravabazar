'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, ChevronDown, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { notificationService, Notification } from '@/services/notificationService';
import { requestForToken, onMessageListener } from '@/lib/firebase';

export function Navbar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [locationName, setLocationName] = useState('New York, USA');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const toggleCart = useCartStore((state) => state.toggleCart);
  const itemCount = useCartStore((state) =>
    state.cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
  );
  const { user } = useUserStore();
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    if (user) {
      fetchWishlist();

      const setupNotifications = async () => {
        try {
          const token = await requestForToken();
          if (token) {
            await notificationService.registerToken(token);
          }
          const notifs = await notificationService.getNotifications(0, 10);
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
          console.error('Failed to setup notifications:', error);
        }
      };
      setupNotifications();

      onMessageListener(async (payload) => {
        console.log("New foreground message:", payload);
        const notifs = await notificationService.getNotifications(0, 10);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      });
    }
  }, [user, fetchWishlist]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Restore saved location if available
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationName(savedLocation);
    }

    // Auto-prompt removed: user must manually click to set location
  }, []);

  const handleDialogChange = (open: boolean) => {
    setLocationDialogOpen(open);
    if (!open) {
      localStorage.setItem('locationPrompted', 'true');
    }
  };

  const handleFetchLocation = () => {
    setIsFetchingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
          const country = data.address.country || 'Unknown Country';
          
          const locationStr = `${city}, ${country}`;
          setLocationName(locationStr);
          localStorage.setItem('userLocation', locationStr);
          localStorage.setItem('locationPrompted', 'true');
          setLocationDialogOpen(false);
        } catch (error) {
          console.error("Error fetching location details", error);
          alert('Failed to get location details');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        alert('Failed to get location');
        setIsFetchingLocation(false);
      }
    );
  };
  
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300 pt-[env(safe-area-inset-top)]">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
           {/* Placeholder for SSR */}
           <div className="flex items-center gap-2">
             <span className="text-xl font-bold text-primary">Ravabazar</span>
           </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300 pt-[env(safe-area-inset-top)]">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Mobile Header (Design Style) */}
        <div className="flex md:hidden items-center justify-between w-full">
          <Dialog open={locationDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger render={<button type="button" className="flex flex-col text-left cursor-pointer bg-transparent border-none p-0 outline-none" />}>
              <span className="text-[10px] text-muted-foreground font-medium mb-0.5">Location</span>
              <div className="flex items-center gap-1 text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold max-w-[120px] truncate">{locationName}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[90vw]">
              <DialogHeader>
                <DialogTitle>Choose Location</DialogTitle>
                <DialogDescription>
                  Allow us to access your location to show products and offers near you.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <Button 
                  onClick={handleFetchLocation} 
                  disabled={isFetchingLocation}
                  className="w-full"
                >
                  {isFetchingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Use Current Location
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-muted/50" />}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary"></span>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`text-sm ${!notif.is_read ? 'font-medium' : ''}`}>{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
