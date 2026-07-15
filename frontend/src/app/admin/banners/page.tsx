'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Banner } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBanners();
      setBanners(res);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch banners'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchBanners();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchBanners]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await adminApi.deleteBanner(id);
      setBanners(banners.filter(b => b.id !== id));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete banner'));
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const res = await adminApi.updateBanner(banner.id, { is_active: !banner.is_active });
      setBanners(banners.map(b => b.id === banner.id ? res : b));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update banner status'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1">Manage homepage carousel banners.</p>
        </div>
        <Button render={<Link href="/admin/banners/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Position</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading banners...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No banners found. Click &quot;Add Banner&quot; to create one.
                  </td>
                </tr>
              ) : (
                banners.sort((a, b) => a.position - b.position).map((banner) => (
                  <tr key={banner.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-16 w-32 relative rounded overflow-hidden bg-muted flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={banner.image_url} 
                          alt={banner.title || 'Banner'} 
                          className="object-cover h-full w-full"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{banner.title || 'Untitled'}</div>
                      {banner.redirect_url && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={banner.redirect_url}>
                          Link: {banner.redirect_url}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                        {banner.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          banner.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(banner.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
