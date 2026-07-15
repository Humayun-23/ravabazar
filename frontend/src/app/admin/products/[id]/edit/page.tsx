'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryWithChildren } from '@/types/product';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { getErrorMessage } from '@/lib/errors';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  // Product state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  
  // Inventory state
  const [stock, setStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  
  // Image state
  const [imageUrl, setImageUrl] = useState('');
  
  // UI state
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cats, prod] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getProductById(id)
        ]);
        
        setCategories(cats);
        
        // Populate form
        setName(prod.name);
        setSlug(prod.slug);
        setSku(prod.sku);
        setDescription(prod.description || '');
        setPrice(prod.price.toString());
        setCategoryId(prod.category_id || '');
        setStock(prod.available_stock?.toString() || '0');
        
        if (prod.primary_image) {
          setImageUrl(prod.primary_image.image_url);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load product data'));
      } finally {
        setInitialLoading(false);
      }
    };
    
    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!categoryId) {
      setError('Please select a category');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        slug,
        sku,
        description,
        price: parseFloat(price),
        category_id: Number(categoryId),
        inventory: {
          stock_quantity: parseInt(stock),
          low_stock_threshold: parseInt(lowStockThreshold)
        },
        images: imageUrl ? [
          {
            image_url: imageUrl,
            alt_text: name,
            is_primary: true,
            display_order: 1
          }
        ] : []
      };

      await adminApi.updateProduct(id, payload);
      router.push('/admin/products');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update product'));
      setIsLoading(false);
    }
  };

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

  if (initialLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading product data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update product details, pricing, and inventory.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/products" />}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">General Information</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  required
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    className="w-full bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU (Stock Keeping Unit)</label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. WNH-001"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[150px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Detailed product description..."
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Media</h2>
            <ImageUpload onUploadSuccess={(url) => setImageUrl(url)} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Organization */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Organization</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">Select a category...</option>
                {renderCategoryOptions(categories)}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Pricing</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full font-mono text-lg"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Inventory</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Threshold</label>
                <Input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
