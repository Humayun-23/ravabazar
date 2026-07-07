'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Order } from '@/types/order';
import { PaginatedResponse } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-500 hover:bg-green-600';
    case 'cancelled':
    case 'failed':
    case 'refunded':
      return 'bg-destructive hover:bg-destructive/90';
    case 'pending_payment':
    case 'cod_pending':
      return 'bg-yellow-500 hover:bg-yellow-600';
    default:
      return 'bg-blue-500 hover:bg-blue-600';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="w-4 h-4 mr-1.5" />;
    case 'cancelled':
    case 'failed':
      return <XCircle className="w-4 h-4 mr-1.5" />;
    default:
      return <Clock className="w-4 h-4 mr-1.5" />;
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
    onError: (err: any) => {
      setCancelError(err.message || 'Failed to cancel order');
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
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Order History</h2>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Failed to load orders.</div>;
  }

  const orders = data?.items || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Order History</h2>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-5 hover:border-primary/50 transition-colors bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Order #{order.id}</span>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                  <span className="hidden md:inline">•</span>
                  <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Total: ₹{order.final_amount.toFixed(2)}</span>
                </div>
                {/* Preview first item */}
                {order.items.length > 0 && (
                  <p className="text-sm font-medium mt-2 line-clamp-1">
                    {order.items[0].product_name_snapshot} {order.items.length > 1 ? `+ ${order.items.length - 1} more` : ''}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {(order.status === 'pending_payment' || order.status === 'cod_pending') && (
                  <Button 
                    variant="destructive" 
                    className="w-full md:w-auto"
                    onClick={() => setCancelOrderId(order.id)}
                  >
                    Cancel
                  </Button>
                )}
                <Button variant="outline" className="w-full md:w-auto" render={<Link href={`/account/orders/${order.id}`} />} nativeButton={false}>
                  View Details <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-xl border-dashed">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No orders yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">When you place an order, it will appear here.</p>
          <Button render={<Link href="/products" />} nativeButton={false} variant="outline">
            Start Shopping
          </Button>
        </div>
      )}

      <Dialog open={cancelOrderId !== null} onOpenChange={(open) => !open && setCancelOrderId(null)}>
        <DialogContent>
          <form onSubmit={handleCancel}>
            <DialogHeader>
              <DialogTitle>Cancel Order #{cancelOrderId}</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <label htmlFor="reason" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Reason for cancellation (Optional)
              </label>
              <Textarea
                id="reason"
                placeholder="Tell us why you are cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              {cancelError && <p className="text-sm text-destructive mt-2">{cancelError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancelOrderId(null)}>
                Keep Order
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
