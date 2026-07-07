export interface OrderItem {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
}

export interface AddressSnapshot {
  title: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
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
  payment?: any; // placeholder for payment details
  shipment?: any; // placeholder for shipment details
  created_at: string;
  updated_at: string;
}
