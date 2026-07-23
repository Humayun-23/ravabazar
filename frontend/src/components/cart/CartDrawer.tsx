'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';

const FREE_SHIPPING_THRESHOLD = 999;

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

function formatPrice(value: number) {
  return `₹${value.toFixed(2)}`;
}

export function CartDrawer() {
  const router = useRouter();
  const { cart, isOpen, isLoading, setIsOpen, fetchCart, updateCartItem, removeCartItem } =
    useCartStore();
  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [fetchCart, isOpen]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  const handleCheckout = () => {
    setIsOpen(false);
    router.push(isAuthenticated ? '/checkout' : '/login?redirect=/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md p-0" side="right">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="bg-primary/10 px-5 py-3 border-b border-primary/20">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> 🎉 You&apos;ve unlocked FREE Delivery!
                </span>
              ) : (
                <span>
                  Add <strong className="text-foreground font-bold">{formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}</strong> more for <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE Delivery</span>
                </span>
              )}
              <span className="text-muted-foreground">{Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Your cart is empty</h3>
            <p className="text-muted-foreground mb-8 max-w-[250px]">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 font-bold"
              render={<Link href="/products" onClick={() => setIsOpen(false)} />}
              nativeButton={false}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {items.map((item) => {
                const price = item.product.sale_price ?? item.product.price;
                const canIncrease = item.quantity < item.product.available_stock;

                return (
                  <div key={item.id} className="flex gap-3 border-b pb-4 last:border-b-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Image
                        src={item.product.primary_image?.image_url || PLACEHOLDER_IMAGE}
                        alt={item.product.primary_image?.alt_text || item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="line-clamp-2 text-sm font-medium hover:text-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                          onClick={() => removeCartItem(item.id)}
                          aria-label={`Remove ${item.product.name}`}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex h-8 items-center rounded-md border bg-background">
                          <button
                            type="button"
                            className="h-full px-3 text-sm hover:bg-muted disabled:opacity-50"
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isLoading}
                            aria-label={`Decrease ${item.product.name} quantity`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="h-full px-3 text-sm hover:bg-muted disabled:opacity-50"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            disabled={!canIncrease || isLoading}
                            aria-label={`Increase ${item.product.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(item.line_total)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter className="border-t px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isLoading}>
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              render={<Link href="/cart" onClick={() => setIsOpen(false)} />}
              nativeButton={false}
            >
              View Cart
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
