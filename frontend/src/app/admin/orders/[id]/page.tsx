'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { Order } from '@/types/order';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getOrderById(Number(params.id));
      setOrder(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load order details'));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchOrder();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const updatedOrder = await adminApi.updateOrderStatus(Number(params.id), newStatus);
      setOrder(updatedOrder);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update order status'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateShiprocketShipment = async () => {
    try {
      setError('');
      setIsCreatingShipment(true);
      await adminApi.createShipment({
        order_id: Number(params.id),
        provider: 'shiprocket',
      });
      await fetchOrder();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create Shiprocket shipment'));
    } finally {
      setIsCreatingShipment(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/orders" />}>
          &larr; Back to Orders
        </Button>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/orders" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.id.toString().padStart(6, '0')}</h1>
          <p className="text-muted-foreground mt-1">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <select 
            className="h-10 px-3 bg-background border rounded-md text-sm font-medium focus:ring-1 focus:ring-ring"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
          >
            <option value="pending_payment">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="cod_pending">COD Pending</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-muted/20 font-medium">Order Items</div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">{item.product_name_snapshot}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right font-medium">
                    ${(item.price_snapshot * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-muted/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${order.shipping_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span>${order.final_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Customer Info</h3>
            <div>
              <p className="font-medium">{order.address_snapshot.full_name}</p>
              <p className="text-sm text-muted-foreground">{order.address_snapshot.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {order.address_snapshot.address_line1}<br />
                {order.address_snapshot.address_line2 && <>{order.address_snapshot.address_line2}<br /></>}
                {order.address_snapshot.city}, {order.address_snapshot.state} {order.address_snapshot.postal_code}<br />
                {order.address_snapshot.country}
              </p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payment Info</h3>
            <div>
              <p className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</p>
              {order.payment && (
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <p>Status: <span className="text-foreground capitalize">{order.payment.status}</span></p>
                  {order.payment.provider_payment_id && (
                    <p className="truncate">Transaction ID: {order.payment.provider_payment_id}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Shipment</h3>
              {order.status === 'packed' && !order.shipment && (
                <Button
                  size="sm"
                  onClick={handleCreateShiprocketShipment}
                  disabled={isCreatingShipment}
                >
                  {isCreatingShipment ? 'Creating...' : 'Create Shiprocket'}
                </Button>
              )}
            </div>

            {order.shipment ? (
              <div className="text-sm space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium capitalize">{order.shipment.provider || 'manual'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{order.shipment.status || 'processing'}</span>
                </div>
                {(order.shipment.awb_number || order.shipment.tracking_number) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">AWB</span>
                    <span className="font-medium text-right break-all">
                      {order.shipment.awb_number || order.shipment.tracking_number}
                    </span>
                  </div>
                )}
                {(order.shipment.courier_company || order.shipment.courier_name) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Courier</span>
                    <span className="font-medium text-right">
                      {order.shipment.courier_company || order.shipment.courier_name}
                    </span>
                  </div>
                )}
                {order.shipment.tracking_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<a href={order.shipment.tracking_url} target="_blank" rel="noreferrer" />}
                  >
                    Track Shipment
                  </Button>
                )}
                {order.shipment.label_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<a href={order.shipment.label_url} target="_blank" rel="noreferrer" />}
                  >
                    Open Label
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.status === 'packed' ? 'Ready for shipment creation.' : 'No shipment yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
