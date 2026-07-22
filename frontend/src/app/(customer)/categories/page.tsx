'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { getCategoryIcon } from '@/lib/categoryUtils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const { data: categories, isLoading: loadingCats } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi('/categories').catch(() => []),
  });

  return (
    <div className="container mx-auto px-4 py-6 md:pb-12 bg-gray-50/30 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm h-10 w-10 shrink-0" render={<Link href="/" />} nativeButton={false}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">All Categories</h1>
      </div>

      {loadingCats ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-8">
          {categories?.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <Link
                href={`/products?category_slug=${cat.slug}`}
                key={cat.id}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-gray-50 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-bold text-foreground text-center line-clamp-2">{cat.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
