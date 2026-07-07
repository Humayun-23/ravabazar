'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { PaginatedResponse, Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ProductListingContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  const categorySlug = searchParams.get('category_slug');
  const search = searchParams.get('search');

  let queryString = `?page=${page}&page_size=20`;
  if (categorySlug) queryString += `&category_slug=${categorySlug}`;
  if (search) queryString += `&search=${search}`;

  const { data, isLoading, error } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', queryString],
    queryFn: () => fetchApi(`/products${queryString}`),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {categorySlug ? `Category: ${categorySlug}` : search ? `Search: ${search}` : 'All Products'}
          </h1>
          {!isLoading && data && (
            <p className="text-muted-foreground mt-1">Showing {data.items.length} of {data.total} products</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          Error loading products. Please try again later.
        </div>
      ) : data?.items.length ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {data.total_pages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
               <span className="text-sm text-muted-foreground">Page {data.page} of {data.total_pages}</span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
          No products found.
        </div>
      )}
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading parameters...</div>}>
      <ProductListingContent />
    </Suspense>
  );
}
