export interface Address {
  id: number;
  user_id: number;
  title: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export type AddressRequest = Omit<Address, 'id' | 'user_id'>;
