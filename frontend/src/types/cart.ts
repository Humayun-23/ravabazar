export interface CartProductImage {
  image_url: string;
  alt_text: string | null;
}

export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  primary_image: CartProductImage | null;
  available_stock: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: CartProduct;
  line_total: number;
}

export interface Cart {
  id: number;
  user_id: number | null;
  session_id: string | null;
  items: CartItem[];
  subtotal: number;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
