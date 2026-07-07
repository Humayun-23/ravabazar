'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryWithChildren } from '@/types/catalog';

export default function NewCategoryPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');
  
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    // Auto-generate slug from name
    if (name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [name]);

  useEffect(() => {
    // Fetch categories for the parent dropdown
    const fetchCategories = async () => {
      try {
        const data = await adminApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch parent categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await adminApi.createCategory({
        name,
        slug,
        parent_id: parentId === '' ? null : Number(parentId),
      });
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      setIsLoading(false);
    }
  };

  // Helper to flatten categories for the select dropdown
  const renderCategoryOptions = (cats: CategoryWithChildren[], level = 0) => {
    let options: React.ReactNode[] = [];
    cats.forEach(c => {
      options.push(
        <option key={c.id} value={c.id}>
          {'\u00A0'.repeat(level * 4)}{c.name}
        </option>
      );
      if (c.children && c.children.length > 0) {
        options = options.concat(renderCategoryOptions(c.children, level + 1));
      }
    });
    return options;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
          <p className="text-muted-foreground mt-1">Add a new product category to your store.</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/categories" />}>
          Cancel
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              type="text"
              placeholder="e.g. Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL Slug</label>
            <Input
              type="text"
              placeholder="e.g. electronics"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">The slug is auto-generated but can be customized. It must be unique.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Category (Optional)</label>
            <select
              className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">None (Top Level Category)</option>
              {renderCategoryOptions(categories)}
            </select>
          </div>

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Category'}
          </Button>
        </form>
      </div>
    </div>
  );
}
