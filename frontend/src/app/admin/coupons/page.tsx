'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Coupon, CouponListResponse } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminCouponsPage() {
  const [data, setData] = useState<CouponListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCoupons({ page, page_size: 10 });
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await adminApi.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      // update local state
      if (data) {
        setData({
          ...data,
          items: data.items.map((c) => (c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c)),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update coupon status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Manage store discounts and promo codes.</p>
        </div>
        <Button render={<Link href="/admin/coupons/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
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
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Discount</th>
                <th className="px-6 py-4 font-medium">Usage</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !data ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Loading coupons...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No coupons found. Click "Create Coupon" to add one.
                  </td>
                </tr>
              ) : (
                data?.items.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground text-lg tracking-wider">{coupon.code}</div>
                      {coupon.min_order_value > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">Min spend: ${coupon.min_order_value.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground font-medium">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF`
                          : `$${coupon.discount_value.toFixed(2)} OFF`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Type: {coupon.discount_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">
                        {coupon.usage_count} / {coupon.usage_limit === 0 ? '∞' : coupon.usage_limit} used
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(coupon)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          coupon.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{((data.page - 1) * data.page_size) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(data.page * data.page_size, data.total)}</span> of{' '}
              <span className="font-medium">{data.total}</span> coupons
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.total_pages}
                onClick={() => setPage(p => p + 1)}
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
