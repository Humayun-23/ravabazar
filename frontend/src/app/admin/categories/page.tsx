'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { CategoryWithChildren } from '@/types/catalog';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your product categories and hierarchy.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/categories/new" />}>
          + Create Category
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No categories found. Create one to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <CategoryRow key={category.id} category={category} level={0} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ category, level }: { category: CategoryWithChildren; level: number }) {
  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-6 py-4 font-medium flex items-center">
          <span style={{ paddingLeft: `${level * 1.5}rem` }}>
            {level > 0 && <span className="text-muted-foreground mr-2">↳</span>}
            {category.name}
          </span>
        </td>
        <td className="px-6 py-4 text-muted-foreground">{category.slug}</td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {level === 0 ? 'Parent' : `Sub-Level ${level}`}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        </td>
      </tr>
      {category.children?.map((child) => (
        <CategoryRow key={child.id} category={child} level={level + 1} />
      ))}
    </>
  );
}
