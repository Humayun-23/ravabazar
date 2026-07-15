'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [usageLimit, setUsageLimit] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        min_order_value: minOrderValue,
        usage_limit: usageLimit,
        is_active: isActive
      };

      await adminApi.createCoupon(payload);
      router.push('/admin/coupons');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create coupon'));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/admin/coupons" />}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
          <p className="text-muted-foreground mt-1">Add a new discount code for your customers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                placeholder="E.g. SUMMER26"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">Customers will enter this code at checkout.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type</Label>
              <select
                id="discountType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input
                id="discountValue"
                type="number"
                min="0.01"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Minimum Order Value ($)</Label>
              <Input
                id="minOrderValue"
                type="number"
                min="0"
                step="0.01"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Optional. Cart subtotal must meet this amount.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="0"
                step="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">0 means unlimited usages.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="is-active">Status</Label>
              <select
                id="is-active"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Active (Customers can use it)</option>
                <option value="false">Inactive (Draft / Disabled)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" disabled={loading} render={<Link href="/admin/coupons" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Coupon
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
