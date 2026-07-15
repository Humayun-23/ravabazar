'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Order } from '@/types/order';
import { PaginatedResponse } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getErrorMessage } from '@/lib/errors';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

function getStatusUI(status: string) {
  switch (status) {
    case 'delivered':
      return {
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        icon: <CheckCircle2 className="w-5 h-5" />,
        label: 'Delivered',
        bar: 'bg-green-500'
      };
    case 'cancelled':
    case 'failed':
    case 'refunded':
      return {
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        icon: <XCircle className="w-5 h-5" />,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        bar: 'bg-destructive'
      };
    case 'pending_payment':
    case 'cod_pending':
      return {
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        icon: <AlertCircle className="w-5 h-5" />,
        label: 'Payment Pending',
        bar: 'bg-yellow-500'
      };
    default:
      return {
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        icon: <Clock className="w-5 h-5" />,
        label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bar: 'bg-blue-500'
      };
  }
}

export default function AccountOrdersPage() {
  const queryClient = useQueryClient();
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const { data, isLoading, error } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['orders', 'my'],
    queryFn: () => fetchApi('/orders/my'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      fetchApi(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
      setCancelOrderId(null);
      setCancelReason('');
      setCancelError('');
    },
    onError: (err) => {
      setCancelError(getErrorMessage(err, 'Failed to cancel order'));
    }
  });

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelOrderId) {
      cancelMutation.mutate({ id: cancelOrderId, reason: cancelReason });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">Order History</h2>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center font-medium p-8 bg-destructive/10 rounded-2xl">Failed to load orders. Please try again later.</div>;
  }

  const orders = data?.items || [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Order History</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Track, manage, and review your past purchases</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusUI = getStatusUI(order.status);
            const firstItem = order.items[0];
            const extraCount = order.items.length - 1;
            
            return (
              <div key={order.id} className="bg-card border shadow-xl shadow-black/5 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
                {/* Header Strip */}
                <div className="bg-muted/30 px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                    <p className="font-bold text-foreground">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date Placed</p>
                    <p className="font-bold text-foreground">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="font-bold text-foreground">₹{order.final_amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-full", statusUI.bg, statusUI.color)}>
                      {statusUI.icon}
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-lg leading-tight", statusUI.color)}>
                        {statusUI.label}
                      </h4>
                      <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
                      </p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {firstItem && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-background shrink-0 shadow-sm">
                        <Image 
                          src={PLACEHOLDER_IMAGE}
                          alt={firstItem.product_name_snapshot}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{firstItem.product_name_snapshot}</p>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Qty: {firstItem.quantity}</p>
                      </div>
                      {extraCount > 0 && (
                        <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-background border shadow-sm text-sm font-bold text-muted-foreground">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row w-full gap-3 mt-6 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl font-bold border-2" 
                      render={<Link href={`/account/orders/${order.id}`} />} 
                      nativeButton={false}
                    >
                      View Details <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    {(order.status === 'pending_payment' || order.status === 'cod_pending') && (
                      <Button 
                        variant="destructive" 
                        className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-destructive/20"
                        onClick={() => setCancelOrderId(order.id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-muted/30 rounded-3xl border border-dashed">
          <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No orders found</h3>
          <p className="text-muted-foreground mt-2 mb-8 font-medium max-w-sm mx-auto">
            You haven&apos;t placed any orders yet. Discover our collection and start shopping!
          </p>
          <Button render={<Link href="/products" />} nativeButton={false} className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20">
            Browse Products
          </Button>
        </div>
      )}

      <Dialog open={cancelOrderId !== null} onOpenChange={(open) => !open && setCancelOrderId(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <form onSubmit={handleCancel}>
            <DialogHeader className="mb-6">
              <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold">Cancel Order #{cancelOrderId}</DialogTitle>
              <DialogDescription className="font-medium text-base mt-2">
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="my-6">
              <label htmlFor="reason" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block ml-1">
                Reason for cancellation (Optional)
              </label>
              <Textarea
                id="reason"
                placeholder="Tell us why you are cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="rounded-2xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 font-medium resize-none p-4"
              />
              {cancelError && <p className="text-sm text-destructive font-semibold mt-3">{cancelError}</p>}
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCancelOrderId(null)} className="h-12 rounded-xl font-bold border-2 sm:w-1/2">
                Keep Order
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelMutation.isPending} className="h-12 rounded-xl font-bold shadow-lg shadow-destructive/20 sm:w-1/2">
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
