export interface OrderItem {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
}

export interface AddressSnapshot {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string | null;
  title: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface PaymentInfo {
  status: string;
  provider_payment_id?: string | null;
}

export interface ShipmentInfo {
  id: number;
  order_id: number;
  tracking_number?: string | null;
  courier_name?: string | null;
  status?: string | null;
  provider?: string | null;
  provider_order_id?: string | null;
  provider_shipment_id?: string | null;
  awb_number?: string | null;
  courier_company?: string | null;
  courier_company_id?: string | null;
  label_url?: string | null;
  invoice_url?: string | null;
  tracking_url?: string | null;
  pickup_token_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  address_snapshot: AddressSnapshot;
  total_amount: number;
  shipping_fee: number;
  tax: number;
  final_amount: number;
  status: string; // pending_payment, paid, cod_pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, failed, refunded
  payment_method: string; // razorpay, cashfree, cod
  cancellation_reason?: string;
  items: OrderItem[];
  payment?: PaymentInfo | null;
  shipment?: ShipmentInfo | null;
  created_at: string;
  updated_at: string;
}
