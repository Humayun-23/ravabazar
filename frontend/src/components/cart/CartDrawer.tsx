'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
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

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/60" />
            <p className="font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add products to start your order.
            </p>
            <Button
              className="mt-6"
              render={<Link href="/products" onClick={() => setIsOpen(false)} />}
              nativeButton={false}
            >
              Continue Shopping
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
