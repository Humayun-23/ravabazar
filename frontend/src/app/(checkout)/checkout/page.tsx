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
import { Label } from '@/components/ui/label';
import { MapPin, CreditCard, ArrowRight, CheckCircle, Package, Lock, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

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

  // Protect route
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

  // Set default address if available
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
      // Clear cart locally (backend should have cleared it too)
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
    return null; // Don't render while redirecting
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 max-w-2xl py-12 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Thank you for your purchase. Your order #{orderSuccess} has been confirmed.
        </p>
        <div className="flex justify-center gap-4">
          <Button render={<Link href="/account/orders" />} nativeButton={false}>
            View Orders
          </Button>
          <Button render={<Link href="/products" />} nativeButton={false} variant="outline">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (isCartLoading && !cart) {
    return (
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const estimatedTotal = Math.max(0, subtotal - (discountAmount || 0));

  if (items.length === 0 && !placeOrderMutation.isPending) {
    return (
      <div className="container mx-auto px-4 max-w-2xl text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button render={<Link href="/products" />} nativeButton={false}>
          Return to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/15 text-destructive font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Address */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-semibold">Delivery Address</h2>
            </div>
            
            {isAddressesLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : addresses.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">You don't have any saved addresses.</p>
                <Button render={<Link href="/account/addresses" />} nativeButton={false} variant="outline">
                  Add New Address
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map(addr => (
                  <label 
                    key={addr.id} 
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <input 
                      type="radio" 
                      name="address" 
                      value={addr.id} 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {addr.title}
                        {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Step 2: Payment Method */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-semibold">Payment Method</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <label className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <Package className="w-8 h-8 mb-3 text-muted-foreground" />
                <span className="font-medium">Cash on Delivery</span>
                <span className="text-xs text-muted-foreground mt-1">Pay when you receive</span>
              </label>
              
              <label className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="razorpay" 
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="sr-only"
                />
                <CreditCard className="w-8 h-8 mb-3 text-muted-foreground" />
                <span className="font-medium">Pay Online</span>
                <span className="text-xs text-muted-foreground mt-1">Credit, Debit, UPI</span>
              </label>
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-muted/30 p-6 rounded-xl border sticky top-24">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 shrink-0 bg-background border rounded overflow-hidden">
                    <Image
                      src={item.product.primary_image?.image_url || PLACEHOLDER_IMAGE}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium line-clamp-2">{item.product.name}</p>
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium">
                    ₹{item.line_total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm mb-6 border-t pt-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {coupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({coupon.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>₹{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-6 mb-6">
              <h3 className="text-sm font-medium mb-3">Promo Code</h3>
              {coupon ? (
                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50/50 rounded-lg mb-6">
                  <div>
                    <div className="font-bold text-green-700">{coupon.code} applied</div>
                    <div className="text-xs text-green-600">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}% OFF`
                        : `₹${coupon.discount_value} OFF`}
                    </div>
                  </div>
                  <button 
                    onClick={removeCoupon} 
                    className="p-1 text-green-700 hover:bg-green-100 rounded-md transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2 mb-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter code..." 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="uppercase"
                    />
                    <Button type="submit" variant="secondary" disabled={!couponCode.trim() || placeOrderMutation.isPending}>
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive font-medium mt-1">{couponError}</p>
                  )}
                </form>
              )}
            </div>

            <Button 
              className="w-full h-12 text-lg"
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || !selectedAddressId}
            >
              {placeOrderMutation.isPending ? 'Processing...' : 'Place Order'}
              {!placeOrderMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secure and encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
