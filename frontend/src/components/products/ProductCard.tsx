import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWished = isInWishlist(product.id);

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-[#f3f4f6] rounded-2xl overflow-hidden mb-3">
        <Image
          src={product.primary_image?.image_url || PLACEHOLDER_IMAGE}
          alt={product.primary_image?.alt_text || product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Floating Action / Favorite Button */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm border-none shadow-none z-10"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
        >
          <Heart className={cn("w-4 h-4 transition-colors", isWished ? "fill-red-500 text-red-500" : "")} />
        </Button>

        {product.available_stock === 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 text-center backdrop-blur-[2px]">
            <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
          </div>
        )}
        
        {product.sale_price && product.available_stock > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 z-10 shadow-sm border-none">
            Sale
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col flex-1 text-center px-1">
        <h3 className="font-bold text-[15px] leading-tight line-clamp-1 mb-0.5 text-foreground">
          {product.name}
        </h3>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{product.category.name}</p>
        <div className="mt-auto">
          {product.sale_price ? (
            <div className="flex items-center justify-center gap-2">
              <span className="font-extrabold text-[15px]">₹{product.sale_price.toFixed(2)}</span>
              <span className="text-[11px] text-muted-foreground line-through font-medium">₹{product.price.toFixed(2)}</span>
            </div>
          ) : (
            <span className="font-extrabold text-[15px]">₹{product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
