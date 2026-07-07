'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { Address } from '@/types/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, CreditCard, ArrowRight, CheckCircle2, Package, Lock, X, Check, Building2, Home, Navigation, Map } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

const getAddressIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('home')) return <Home className="w-5 h-5" />;
  if (t.includes('work') || t.includes('office')) return <Building2 className="w-5 h-5" />;
  return <Map className="w-5 h-5" />;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, fetchCart, coupon, discountAmount, applyCoupon, removeCoupon } = useCartStore();
  const { isAuthenticated } = useUserStore();
  
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      router.push('/login?redirect=/checkout');
    } else {
      fetchCart();
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [isAuthenticated, router, fetchCart]);

  const { data: addresses = [], isLoading: isAddressesLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => fetchApi('/users/me/addresses'),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.is_default);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const placeOrderMutation = useMutation({
    mutationFn: () => fetchApi('/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: coupon ? coupon.code : null,
      }),
    }),
    onSuccess: (data) => {
      useCartStore.getState().fetchCart();
      setOrderSuccess(data.id);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to place order');
    }
  });

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }
    setError('');
    placeOrderMutation.mutate();
  };

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
    return null;
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 max-w-lg py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-10 text-lg font-medium">
          Thank you for your purchase. Your order <span className="text-foreground font-bold">#{orderSuccess}</span> is being processed.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button render={<Link href="/account/orders" />} nativeButton={false} className="h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 sm:w-1/2">
            View Orders
          </Button>
          <Button render={<Link href="/products" />} nativeButton={false} variant="outline" className="h-14 rounded-xl text-lg font-bold border-2 sm:w-1/2">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (isCartLoading && !cart) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const estimatedTotal = Math.max(0, subtotal - (discountAmount || 0));

  if (items.length === 0 && !placeOrderMutation.isPending) {
    return (
      <div className="container mx-auto px-4 max-w-lg text-center py-24 bg-card mt-12 rounded-3xl border shadow-xl shadow-black/5">
        <Package className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground font-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button render={<Link href="/products" />} nativeButton={false} className="h-12 rounded-xl font-bold px-8 shadow-lg shadow-primary/20">
          Return to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-4 md:py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Secure Checkout</h1>
          <p className="text-sm font-medium text-muted-foreground">Complete your purchase safely</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/15 text-destructive font-bold text-center animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Left Column (Address & Payment) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Address */}
          <section className="bg-card border shadow-xl shadow-black/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Delivery Address</h2>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">Where should we send your order?</p>
              </div>
            </div>
            
            {isAddressesLoading ? (
              <div className="grid gap-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 border border-dashed rounded-2xl">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-6">You don't have any saved addresses.</p>
                <Button render={<Link href="/account/addresses" />} nativeButton={false} variant="outline" className="h-12 rounded-xl font-bold border-2">
                  Add New Address
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <label 
                    key={addr.id} 
                    className={cn(
                      "relative flex flex-col p-5 border rounded-2xl cursor-pointer transition-all duration-200",
                      selectedAddressId === addr.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md" 
                        : "hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                    )}
                  >
                    <input 
                      type="radio" 
                      name="address" 
                      value={addr.id} 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="sr-only"
                    />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                        selectedAddressId === addr.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {getAddressIcon(addr.title)}
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedAddressId === addr.id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {selectedAddressId === addr.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-foreground mb-1 flex items-center gap-2">
                        {addr.title}
                        {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                      </h4>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {addr.street_address}, {addr.city}
                      </p>
                    </div>
                  </label>
                ))}
                
                <label className="flex flex-col items-center justify-center p-5 border border-dashed rounded-2xl cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground">
                   <Link href="/account/addresses" className="flex flex-col items-center justify-center w-full h-full">
                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                       <MapPin className="w-5 h-5" />
                     </div>
                     <span className="font-bold text-sm">Add New Address</span>
                   </Link>
                </label>
              </div>
            )}
          </section>

          {/* Step 2: Payment Method */}
          <section className={cn(
            "bg-card border shadow-xl shadow-black/5 rounded-3xl p-6 md:p-8 transition-opacity duration-300",
            !selectedAddressId ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Payment Method</h2>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">How would you like to pay?</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <label className={cn(
                "relative flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all duration-200 text-center",
                paymentMethod === 'cod' 
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md" 
                  : "hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
              )}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    paymentMethod === 'cod' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  )}>
                    {paymentMethod === 'cod' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  paymentMethod === 'cod' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Package className="w-6 h-6" />
                </div>
                <span className="font-bold text-foreground text-lg mb-1">Cash on Delivery</span>
                <span className="text-xs text-muted-foreground font-medium">Pay in cash when order arrives</span>
              </label>
              
              <label className={cn(
                "relative flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all duration-200 text-center",
                paymentMethod === 'razorpay' 
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md" 
                  : "hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
              )}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="razorpay" 
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="sr-only"
                />
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    paymentMethod === 'razorpay' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  )}>
                    {paymentMethod === 'razorpay' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  paymentMethod === 'razorpay' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="font-bold text-foreground text-lg mb-1">Pay Online</span>
                <span className="text-xs text-muted-foreground font-medium">Credit, Debit, UPI, Netbanking</span>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column (Order Summary) */}
        <div className="lg:col-span-5 relative">
          <div className="bg-card border shadow-xl shadow-black/5 rounded-3xl p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="relative w-16 h-16 shrink-0 bg-background rounded-xl overflow-hidden shadow-sm">
                    <Image
                      src={item.product.primary_image?.image_url || PLACEHOLDER_IMAGE}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-foreground text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-muted-foreground text-xs font-medium mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-bold text-foreground flex items-center">
                    ₹{item.line_total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-6 mb-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Have a promo code?</h3>
              {coupon ? (
                <div className="flex items-center justify-between p-4 border border-green-500/20 bg-green-500/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-green-700 uppercase tracking-wide">{coupon.code}</div>
                      <div className="text-xs text-green-600 font-medium">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF applied`
                          : `₹${coupon.discount_value} OFF applied`}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={removeCoupon} 
                    className="p-2 text-green-700 hover:bg-green-500/20 rounded-xl transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input 
                    placeholder="Enter code..." 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="uppercase h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  <Button type="submit" variant="secondary" className="h-12 px-6 rounded-xl font-bold border-2" disabled={!couponCode.trim() || placeOrderMutation.isPending}>
                    Apply
                  </Button>
                </form>
              )}
              {couponError && (
                <p className="text-xs text-destructive font-bold mt-2 ml-1 animate-in fade-in">{couponError}</p>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium mb-6 border-t pt-6 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {coupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-foreground font-bold">₹0.00</span>
              </div>
              
              <div className="border-t pt-4 mt-2 flex justify-between items-center text-foreground">
                <span className="text-base font-bold">Total</span>
                <span className="text-3xl font-black tracking-tight text-primary">₹{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className={cn(
                "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300",
                !selectedAddressId ? "opacity-50 cursor-not-allowed" : "shadow-primary/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30"
              )}
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || !selectedAddressId}
            >
              {placeOrderMutation.isPending ? 'Processing Securely...' : 'Place Order Securely'}
              {!placeOrderMutation.isPending && <Lock className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
