import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isLoading } = useCartStore();
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden group h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-muted/20">
          <Image
            src={product.primary_image?.image_url || PLACEHOLDER_IMAGE}
            alt={product.primary_image?.alt_text || product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.available_stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
            </div>
          )}
          {product.sale_price && product.available_stock > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">Sale</Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {product.sale_price ? (
              <>
                <span className="font-bold text-lg">₹{product.sale_price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-bold text-lg">₹{product.price.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            disabled={product.available_stock === 0 || isLoading}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
