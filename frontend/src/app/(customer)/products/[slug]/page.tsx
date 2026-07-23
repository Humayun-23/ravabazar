'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ShoppingBag, ChevronLeft, Minus, Plus, Star, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProductReviews } from './ProductReviews';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toggleCart, addToCart, isLoading: isLoadingCart, cart } = useCartStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => fetchApi(`/products/${slug}`),
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-background flex flex-col">
        <Skeleton className="w-full aspect-[4/5] md:aspect-video md:h-[60vh]" />
        <div className="flex-1 bg-background -mt-8 rounded-t-[32px] p-6 space-y-4 relative z-10">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full mt-8" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
        <Button onClick={() => router.back()} className="mt-8 rounded-full">Go Back</Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : (product.primary_image ? [product.primary_image] : []);
  const displayImage = selectedImage || images[0]?.image_url || PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-muted/30 pb-24 md:pb-0">
      <div className="md:container md:mx-auto md:px-4 md:py-8">
        <div className="grid md:grid-cols-2 gap-0 md:gap-12 lg:gap-16 relative">
          
          {/* Image Section (Full bleed on mobile) */}
          <div className="relative w-full aspect-[4/5] md:aspect-square md:h-auto md:rounded-3xl overflow-hidden bg-muted shrink-0">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            
            {/* Floating Top Nav (Mobile Only) */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-center md:hidden z-20 bg-gradient-to-b from-black/20 to-transparent">
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-white drop-shadow-md">Detail Product</span>
              <button 
                onClick={toggleCart} 
                className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 border border-background">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Image thumbnails for desktop or overlay */}
            {images.length > 1 && (
              <div className="absolute bottom-12 md:bottom-6 left-0 right-0 flex justify-center gap-2 z-20 hidden md:flex">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${selectedImage === img.image_url ? 'border-primary' : 'border-background shadow-md'}`}
                  >
                    <Image src={img.image_url} alt={img.alt_text || 'Thumbnail'} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sheet Content Section */}
          <div className="relative z-30 bg-background -mt-8 md:mt-0 rounded-t-[32px] md:rounded-none px-6 pt-8 md:p-0 flex flex-col md:justify-center">
            
            {/* Title & Quantity Row */}
            <div className="flex justify-between items-start gap-4 mb-3">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight flex-1">
                {product.name}
              </h1>
              
              <button
                onClick={() => toggleWishlist(product.id)}
                className="w-10 h-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors mt-1"
              >
                <Heart className={cn("w-5 h-5 transition-colors", isInWishlist(product.id) ? "fill-red-500 text-red-500" : "")} />
              </button>
              
              {/* Desktop-only Quantity (Mobile has it inline in mockup, but we'll put it here for both to match mockup) */}
              <div className="flex items-center bg-muted rounded-full px-1 py-1 shrink-0">
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-background shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.available_stock === 0}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-background shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.min(product.available_stock, quantity + 1))}
                  disabled={product.available_stock === 0 || quantity >= product.available_stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Reviews & Stock */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                <span className="font-bold text-sm">{product.average_rating ? product.average_rating.toFixed(1) : '0.0'}</span>
                <span className="text-muted-foreground text-sm">({product.review_count || 0} Review)</span>
              </div>
              <div>
                {product.available_stock > 0 ? (
                  <span className="text-sm font-bold text-foreground">Available in stock</span>
                ) : (
                  <span className="text-sm font-bold text-destructive">Out of stock</span>
                )}
              </div>
            </div>
            

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {product.description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."}
                <button className="text-primary font-semibold ml-1">Read More</button>
              </p>
            </div>
            
            {/* Desktop Action Bar (Mobile is sticky) */}
            <div className="hidden md:flex items-center justify-between mt-auto pt-8 border-t">
              <div className="flex items-end gap-3">
                {product.sale_price ? (
                  <>
                    <span className="text-4xl font-extrabold text-[#312e81]">₹{product.sale_price.toFixed(2)}</span>
                    <span className="text-xl text-muted-foreground line-through mb-1">₹{product.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-4xl font-extrabold text-[#312e81]">₹{product.price.toFixed(2)}</span>
                )}
              </div>
              <Button 
                size="lg" 
                className="rounded-full px-8 h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold" 
                disabled={product.available_stock === 0 || isLoadingCart}
                onClick={async () => {
                  try {
                    await addToCart(product.id, quantity);
                  } catch (err) {
                    console.error('Failed to add to cart:', err);
                  }
                }}
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                {isLoadingCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
            
            {/* Reviews Section */}
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 bg-background/95 backdrop-blur-md border-t z-50 flex items-center justify-between gap-4">
        <div className="flex items-end gap-2 shrink-0">
           {product.sale_price ? (
             <span className="text-3xl font-extrabold text-[#312e81]">₹{product.sale_price.toFixed(2)}</span>
           ) : (
             <span className="text-3xl font-extrabold text-[#312e81]">₹{product.price.toFixed(2)}</span>
           )}
        </div>
        <Button 
          size="lg" 
          className="rounded-full flex-1 h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-lg shadow-primary/25" 
          disabled={product.available_stock === 0 || isLoadingCart}
          onClick={async () => {
            try {
              await addToCart(product.id, quantity);
            } catch (err) {
              console.error('Failed to add to cart:', err);
            }
          }}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          {isLoadingCart ? 'Adding...' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}
