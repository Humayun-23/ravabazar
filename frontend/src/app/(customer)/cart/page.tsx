'use client';

import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Trash2, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function CartPage() {
  const { cart, isLoading, fetchCart, updateCartItem, removeCartItem, coupon, discountAmount, applyCoupon, removeCoupon } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (err) {
      setCouponError(getErrorMessage(err, 'Invalid coupon code'));
    }
  };

  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const estimatedTotal = Math.max(0, subtotal - discountAmount);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Button render={<Link href="/products" />} nativeButton={false} size="lg">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border bg-card">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-muted rounded-md overflow-hidden">
                <Image
                  src={item.product.primary_image?.image_url || PLACEHOLDER_IMAGE}
                  alt={item.product.primary_image?.alt_text || item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-primary transition-colors line-clamp-2">
                      {item.product.name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.product.sale_price ? (
                        <>
                          <span className="font-bold text-foreground mr-2">₹{item.product.sale_price.toFixed(2)}</span>
                          <span className="line-through">₹{item.product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-foreground">₹{item.product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeCartItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border rounded-md bg-background">
                    <button 
                      className="px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                      onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1 || isLoading}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      className="px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                      onClick={() => updateCartItem(item.id, Math.min(item.product.available_stock, item.quantity + 1))}
                      disabled={item.quantity >= item.product.available_stock || isLoading}
                    >
                      +
                    </button>
                  </div>
                  <div className="font-semibold text-lg">
                    ₹{item.line_total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 p-6 rounded-xl border sticky top-24 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
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
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Estimated Total</span>
                <span>₹{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="mt-4 text-center">
              <Link href="/products" className="text-sm text-primary hover:underline">
                or Continue Shopping
              </Link>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Promo Code</h3>
            {coupon ? (
              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50/50 rounded-lg">
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
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter code..." 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="uppercase"
                  />
                  <Button type="submit" variant="secondary" disabled={!couponCode.trim() || isLoading}>
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive font-medium mt-1">{couponError}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
