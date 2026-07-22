'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

function getStoredRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = localStorage.getItem('recentSearches');
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch (error) {
    console.error('Failed to parse recent searches', error);
    return [];
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl min-h-[calc(100vh-64px)]">
      <Skeleton className="w-full h-12 rounded-full mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/2 h-4" />
              <Skeleton className="w-1/3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(getStoredRecentSearches);

  // Save recent searches when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Fetch popular products when NO active query
  const { data: popularData, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popularProducts'],
    queryFn: () => fetchApi('/products?is_featured=true&page_size=5'),
    enabled: !activeQuery,
  });

  // Fetch search results when THERE IS an active query
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['searchResults', activeQuery],
    queryFn: () => fetchApi(`/products?search=${encodeURIComponent(activeQuery)}`),
    enabled: !!activeQuery,
  });

  const popularProducts: Product[] = popularData?.items || [];
  const searchResults: Product[] = searchData?.items || [];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setActiveQuery('');
      return;
    }
    
    setActiveQuery(query);
    // Add to recent searches, avoiding duplicates and keeping max 10
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 10);
    });
    
    // Update URL without reload
    router.replace(`/search?q=${encodeURIComponent(query)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches(prev => prev.filter(t => t !== term));
  };

  const clickRecentSearch = (term: string) => {
    setQuery(term);
    setActiveQuery(term);
    router.replace(`/search?q=${encodeURIComponent(term)}`);
  };
  
  // Badges array for popular search visual variations
  const badgeVariations = [
    { label: 'Hot', className: 'bg-red-100 text-red-500' },
    { label: 'New', className: 'bg-orange-100 text-orange-500' },
    { label: 'Popular', className: 'bg-green-100 text-green-500' }
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl min-h-[calc(100vh-64px)]">
      {/* Top Search Bar */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full h-12 pl-12 pr-4 bg-background border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
              autoFocus
            />
          </div>
        </form>
      </div>

      {!activeQuery ? (
        // Empty State: Recent and Popular Searches
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Last Search</h2>
                <button 
                  onClick={clearRecentSearches}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <div 
                    key={term} 
                    className="flex items-center gap-2 bg-background border px-4 py-2 rounded-full shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => clickRecentSearch(term)}
                  >
                    <span className="text-sm font-medium text-foreground">{term}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(term);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Popular Search</h2>
            
            {isLoadingPopular ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/2 h-4" />
                      <Skeleton className="w-1/3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {popularProducts.map((product, index) => {
                  const badge = badgeVariations[index % badgeVariations.length];
                  return (
                    <Link 
                      href={`/products/${product.slug}`} 
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative bg-muted rounded-2xl overflow-hidden shrink-0 border">
                          <Image 
                            src={product.primary_image?.image_url || PLACEHOLDER_IMAGE} 
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {product.category?.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                        {badge.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Search Results State
        <div className="animate-in fade-in duration-300">
          <h2 className="text-lg font-bold text-foreground mb-6">
            Search Results for &quot;{activeQuery}&quot;
          </h2>
          
          {isLoadingSearch ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
               {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {searchResults.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-sm">
                We couldn&apos;t find any products matching &quot;{activeQuery}&quot;. Try adjusting your search terms.
              </p>
              <button 
                onClick={() => {
                  setQuery('');
                  setActiveQuery('');
                }}
                className="mt-6 font-semibold text-primary hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
