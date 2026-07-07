export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  sale_price?: number;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  is_featured: boolean;
  category: Category;
  primary_image?: ProductImage;
  images?: ProductImage[];
  available_stock: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
