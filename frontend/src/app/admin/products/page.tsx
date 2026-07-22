'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { getErrorMessage } from '@/lib/errors';

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getProducts({ page, page_size: 10 });
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load products'));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog, inventory, and pricing.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          + Create Product
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No products found. Create one to get started.
                  </td>
                </tr>
              ) : (
                data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.primary_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.primary_image.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-muted-foreground text-xs">No img</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category?.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4 font-medium">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          product.available_stock > 5 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span>{product.available_stock} in stock</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" render={<Link href={`/admin/products/${product.id}/edit`} />}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {data.page} of {data.total_pages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
