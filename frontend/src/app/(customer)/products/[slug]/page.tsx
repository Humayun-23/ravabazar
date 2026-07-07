'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toggleCart, addToCart, isLoading: isLoadingCart } = useCartStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => fetchApi(`/products/${slug}`),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-12 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground">The product you're looking for doesn't exist or is unavailable.</p>
      </div>
    );
  }

  const images = product.images?.length ? product.images : (product.primary_image ? [product.primary_image] : []);
  const displayImage = selectedImage || images[0]?.image_url || PLACEHOLDER_IMAGE;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-muted/20 rounded-xl overflow-hidden border">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === img.image_url ? 'border-primary' : 'border-transparent'}`}
                >
                  <Image src={img.image_url} alt={img.alt_text || 'Thumbnail'} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{product.category.name}</span>
            <span>•</span>
            <span>SKU: {product.sku}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            {product.sale_price ? (
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold">₹{product.sale_price.toFixed(2)}</span>
                <span className="text-xl text-muted-foreground line-through mb-1">₹{product.price.toFixed(2)}</span>
                <Badge className="bg-red-500 hover:bg-red-600 mb-2">Sale</Badge>
              </div>
            ) : (
              <span className="text-3xl font-bold">₹{product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            {product.description}
          </p>

          <div className="mb-8">
            {product.available_stock > 0 ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium mb-4">
                <CheckCircle className="w-5 h-5" />
                <span>In Stock ({product.available_stock} available)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive font-medium mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span>Out of Stock</span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <button 
                  className="px-4 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.available_stock === 0}
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button 
                  className="px-4 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.min(product.available_stock, quantity + 1))}
                  disabled={product.available_stock === 0 || quantity >= product.available_stock}
                >
                  +
                </button>
              </div>
              <Button 
                size="lg" 
                className="flex-1" 
                disabled={product.available_stock === 0 || isLoadingCart}
                onClick={async () => {
                  try {
                    await addToCart(product.id, quantity);
                  } catch (err) {
                    console.error('Failed to add to cart:', err);
                  }
                }}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isLoadingCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
