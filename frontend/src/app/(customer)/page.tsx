'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { PaginatedResponse, Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { getCategoryIcon } from '@/lib/categoryUtils';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const { data: categories, isLoading: loadingCats } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi('/categories').catch(() => []),
  });

  const { data: featuredData, isLoading: loadingProducts } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchApi('/products?is_featured=true&page_size=8').catch(() => ({ items: [], page: 1, page_size: 8, total: 0, total_pages: 0 })),
  });

  const featuredProducts = featuredData?.items || [];
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="container mx-auto px-4 py-4 md:pb-12 bg-gray-50/30 min-h-screen">

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-8 mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Furniture"
            className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm border border-gray-100"
          />
        </div>
        <Button size="icon" className="h-[52px] w-[52px] rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-sm hover:bg-primary/90">
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Promo Banner */}
      <section className="mb-8">
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-sm flex flex-col justify-center min-h-[160px]">
          <div className="relative z-10 max-w-[55%]">
            <h1 className="text-xl font-bold mb-1 text-foreground leading-tight">New Collection</h1>
            <p className="text-[11px] text-muted-foreground mb-4 leading-snug">Discount 50% for<br />the first transaction</p>
            <Button size="sm" className="rounded-full bg-[#334155] text-white hover:bg-black text-xs h-8 px-4 font-medium" render={<Link href="/products" />} nativeButton={false}>
              Shop Now
            </Button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-2">
            <div className="relative w-full h-[140%] -right-4 -bottom-4">
              <Image
                src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=400&auto=format&fit=crop"
                alt="Furniture Collection"
                fill
                unoptimized
                className="object-contain object-right drop-shadow-2xl mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Category</h2>
          <Link href="/categories" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            See All
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {loadingCats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 min-w-[72px]">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))
          ) : categories?.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <Link
                href={`/products?category_slug=${cat.slug}`}
                key={cat.id}
                className="flex flex-col items-center gap-3 min-w-[72px] group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-50 flex items-center justify-center text-[#334155] group-hover:bg-[#334155] group-hover:text-white transition-colors">
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-bold text-foreground">{cat.name}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">New Arrivals</h2>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-2">
          {['All', 'Newest', 'Popular', 'Bedroom'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shadow-sm border border-gray-100 ${activeFilter === filter
                  ? 'bg-[#334155] text-white'
                  : 'bg-white text-muted-foreground hover:bg-gray-50'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
            No products available at the moment.
          </div>
        )}
      </section>
    </div>
  );
}
