'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Banner } from '@/types/banner';
import { PaginatedResponse, Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const { data: banners, isLoading: loadingBanners } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: () => fetchApi('/banners').catch(() => []),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi('/categories').catch(() => []),
  });

  const { data: featuredData, isLoading: loadingProducts } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchApi('/products?is_featured=true&page_size=8').catch(() => ({ items: [], page: 1, page_size: 8, total: 0, total_pages: 0 })),
  });

  const featuredProducts = featuredData?.items || [];
  
  const [activeTab, setActiveTab] = useState<'home' | 'category'>('home');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top Tabs (Kutuku Style) */}
      <div className="flex border-b border-muted mb-6 -mx-4 px-4">
        <div className="flex-1 text-center">
          <button 
            onClick={() => setActiveTab('home')}
            className={cn("inline-block pb-3 px-4", activeTab === 'home' ? "font-semibold text-primary border-b-2 border-primary" : "font-medium text-muted-foreground")}
          >
            Home
          </button>
        </div>
        <div className="flex-1 text-center">
          <button 
            onClick={() => setActiveTab('category')}
            className={cn("inline-block pb-3 px-4", activeTab === 'category' ? "font-semibold text-primary border-b-2 border-primary" : "font-medium text-muted-foreground")}
          >
            Category
          </button>
        </div>
      </div>

      {activeTab === 'home' ? (
        <>
          {/* Promo Banner Section */}
          <section className="mb-10">
            <div className="relative w-full h-44 md:h-64 rounded-3xl overflow-hidden bg-[#e0e7ff] flex items-center p-6 md:p-12 shadow-sm">
              {/* Decorative Circle */}
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#c7d2fe] opacity-80" />
              
              <div className="relative z-10 text-foreground max-w-[60%]">
                <h1 className="text-xl md:text-3xl font-extrabold mb-2 leading-tight text-[#312e81]">
                  24% off shipping today on bag purchases
                </h1>
                <p className="text-sm md:text-base text-[#4338ca] font-medium mb-4">By Kutuku Store</p>
                <Button size="sm" render={<Link href="/products" />} nativeButton={false} className="rounded-full bg-[#4f46e5] text-white hover:bg-[#4338ca]">
                  Shop Now
                </Button>
              </div>
              {/* Decorative placeholder for bag image on the right */}
              <div className="absolute -right-4 bottom-0 w-32 h-40 md:w-48 md:h-56 bg-primary/20 rounded-t-xl" />
            </div>
          </section>

          {/* New Arrivals Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">New Arrivals 🔥</h2>
              <Link href="/products" className="text-sm font-bold text-primary hover:underline">
                See All
              </Link>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
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
        </>
      ) : (
        <div className="space-y-4 pb-12">
          {categories?.map((cat) => (
            <Link 
              href={`/products?category_slug=${cat.slug}`} 
              key={cat.id} 
              className="block bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-sm overflow-hidden relative"
            >
              <div className="relative z-10 max-w-[60%]">
                <h3 className="font-extrabold text-2xl md:text-3xl mb-1 text-foreground">{cat.name}</h3>
                <p className="text-muted-foreground font-medium text-sm md:text-base">Shop Collection</p>
              </div>
              
              {/* Abstract decorative shape since we don't have category images */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/10 rounded-l-[100px]" />
            </Link>
          ))}
          {(!categories || categories.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No categories available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
