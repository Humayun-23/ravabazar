'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';

export default function NewBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [position, setPosition] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!imageUrl) {
        throw new Error('Please upload a banner image first');
      }

      // Create banner
      const payload = {
        title: title.trim() || null,
        image_url: imageUrl,
        redirect_url: redirectUrl.trim() || null,
        position,
        is_active: isActive
      };

      await adminApi.createBanner(payload);
      router.push('/admin/banners');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create banner'));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/admin/banners" />}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Banner</h1>
          <p className="text-muted-foreground mt-1">Upload a new banner image for the homepage carousel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Banner Image (Required)</Label>
              <p className="text-xs text-muted-foreground mb-4">
                Recommended size: 1920x600 pixels. High quality image.
              </p>
              <ImageUpload
                onUploadSuccess={(url) => {
                  setImageUrl(url);
                }}
              />
            </div>
            
            <div className="space-y-2 pt-4">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="E.g. Summer Sale 50% Off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
              <Input
                id="redirectUrl"
                placeholder="E.g. /categories/electronics"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Where should the user go when they click this banner?</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="position">Position / Ordering</Label>
                <Input
                  id="position"
                  type="number"
                  min="0"
                  value={position}
                  onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is-active">Status</Label>
                <select
                  id="is-active"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Draft / Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" disabled={loading} render={<Link href="/admin/banners" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Banner
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
