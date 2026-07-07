'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Banner } from '@/types/banner';
import { PaginatedResponse, Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { data: banners, isLoading: loadingBanners } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: () => fetchApi('/banners').catch(() => []),
  });

  const { data: featuredData, isLoading: loadingProducts } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchApi('/products?is_featured=true&page_size=8').catch(() => ({ items: [], page: 1, page_size: 8, total: 0, total_pages: 0 })),
  });

  const featuredProducts = featuredData?.items || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banners Section */}
      <section className="mb-12">
        {loadingBanners ? (
          <Skeleton className="w-full h-64 md:h-96 rounded-xl" />
        ) : banners && banners.length > 0 ? (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-muted">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banners[0].image_url})` }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center p-8 md:p-16">
              <div className="text-white max-w-lg">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{banners[0].title}</h1>
                {banners[0].redirect_url && (
                  <Button 
                    size="lg" 
                    className="mt-4"
                    render={<Link href={banners[0].redirect_url} />}
                    nativeButton={false}
                  >
                    Shop Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-64 md:h-96 rounded-xl bg-primary/10 flex items-center justify-center flex-col text-center p-8">
             <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">
                Welcome to Ravabazar
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your premier ecommerce destination.
              </p>
              <Button size="lg" render={<Link href="/products" />} nativeButton={false}>
                Browse Catalog
              </Button>
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
          <Button variant="ghost" render={<Link href="/products" />} nativeButton={false}>
            View All
          </Button>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
            No featured products available at the moment.
          </div>
        )}
      </section>
    </div>
  );
}
