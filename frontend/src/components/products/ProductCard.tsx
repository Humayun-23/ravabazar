'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToCart, toggleCart } = useCartStore();
  const { addToast } = useToastStore();
  const [isAdding, setIsAdding] = useState(false);

  const isWished = isInWishlist(product.id);
  const price = product.sale_price ?? product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || product.available_stock === 0) return;

    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
      addToast({
        title: 'Added to Cart!',
        message: `${product.name} - ₹${price.toFixed(2)}`,
        image_url: product.primary_image?.image_url,
        actionText: 'View Cart',
        onAction: () => toggleCart(),
      });
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-col h-full bg-white dark:bg-card rounded-3xl p-3 pb-4 shadow-sm border border-gray-100 dark:border-border transition-all hover:shadow-xl hover:border-primary/30"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-50/50 dark:bg-muted/40">
          <Image
            src={product.primary_image?.image_url || PLACEHOLDER_IMAGE}
            alt={product.primary_image?.alt_text || product.name}
            fill
            className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
          />

          {/* Floating Action / Favorite Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 dark:bg-background/90 text-muted-foreground shadow-sm hover:bg-white hover:scale-110 transition-transform z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
          >
            <Heart
              className={cn(
                'w-3.5 h-3.5 transition-colors',
                isWished ? 'fill-red-500 text-red-500' : ''
              )}
            />
          </Button>

          {product.available_stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 text-center backdrop-blur-[2px]">
              <Badge variant="destructive" className="text-xs font-bold">
                Out of Stock
              </Badge>
            </div>
          )}

          {product.sale_price && product.available_stock > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-[10px] font-bold z-10 shadow-sm border-none">
              Sale
            </Badge>
          )}
        </div>

        <div className="flex flex-col flex-1 px-1 mt-1">
          <h3 className="font-bold text-[13px] leading-tight line-clamp-1 mb-1 text-foreground">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center justify-between pt-2">
            {product.sale_price ? (
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[14px]">
                  ₹{product.sale_price.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground line-through font-medium">
                  ₹{product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-[14px]">
                ₹{product.price.toFixed(2)}
              </span>
            )}

            {/* Quick Add To Cart Button */}
            {product.available_stock > 0 && (
              <Button
                size="icon"
                variant="default"
                disabled={isAdding}
                onClick={handleAddToCart}
                className="h-8 w-8 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="sr-only">Add to Cart</span>
              </Button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
