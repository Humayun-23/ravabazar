'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Order } from '@/types/order';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Package, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

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

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['orders', resolvedParams.id],
    queryFn: () => fetchApi(`/orders/${resolvedParams.id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium mb-4">Failed to load order details.</p>
        <Button render={<Link href="/account/orders" />} nativeButton={false} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button render={<Link href="/account/orders" />} nativeButton={false} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Order #{order.id}</h2>
        <Badge className={`ml-auto md:ml-4 text-sm ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {order.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items ({order.items.length})
              </h3>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h4 className="font-medium">{item.product_name_snapshot}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    ₹{(item.price_snapshot * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Info (if applicable) */}
          {order.status === 'cancelled' && order.cancellation_reason && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4" /> Cancellation Reason
              </h3>
              <p className="text-sm">{order.cancellation_reason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" /> Payment Summary
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_fee === 0 ? 'Free' : `₹${order.shipping_fee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-1 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{order.final_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <span className="text-muted-foreground">Method: </span>
              <span className="font-medium uppercase">{order.payment_method}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" /> Delivery Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.address_snapshot.title}</p>
              <p className="text-muted-foreground">{order.address_snapshot.street_address}</p>
              <p className="text-muted-foreground">
                {order.address_snapshot.city}, {order.address_snapshot.state} {order.address_snapshot.postal_code}
              </p>
              <p className="text-muted-foreground">{order.address_snapshot.country}</p>
            </div>
          </div>
          
          {/* Timeline Info */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" /> Timeline
            </h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>Placed on: {new Date(order.created_at).toLocaleString()}</p>
              <p>Last updated: {new Date(order.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
