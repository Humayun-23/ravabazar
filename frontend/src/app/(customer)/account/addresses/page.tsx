'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Address, AddressRequest } from '@/types/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

const INITIAL_ADDRESS: AddressRequest = {
  title: '',
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false
};

export default function AccountAddressesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressRequest>(INITIAL_ADDRESS);

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => fetchApi('/users/me/addresses'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AddressRequest) => fetchApi('/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAdding(false);
      setFormData(INITIAL_ADDRESS);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddressRequest }) => fetchApi(`/users/me/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingId(null);
      setFormData(INITIAL_ADDRESS);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/users/me/addresses/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (addr: Address) => {
    setFormData({
      title: addr.title,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default
    });
    setEditingId(addr.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(INITIAL_ADDRESS);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add New Address
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-muted/30 p-6 rounded-xl border mb-8">
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Address Title (e.g., Home, Work)</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input 
                id="street_address" 
                value={formData.street_address} 
                onChange={(e) => setFormData({...formData, street_address: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={formData.city} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  value={formData.state} 
                  onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input 
                  id="postal_code" 
                  value={formData.postal_code} 
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  value={formData.country} 
                  onChange={(e) => setFormData({...formData, country: e.target.value})} 
                  required 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="is_default" 
                checked={formData.is_default}
                onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Update Address' : 'Save Address'}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="relative group border rounded-xl p-5 hover:border-primary/50 transition-colors bg-card">
              {addr.is_default && (
                <span className="absolute top-4 right-4 text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Default
                </span>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{addr.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{addr.street_address}</p>
                  <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                  <p className="text-sm text-muted-foreground">{addr.country}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(addr)}>
                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(addr.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !isAdding && (
        <div className="text-center py-12 border rounded-xl border-dashed">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No addresses found</h3>
          <p className="text-muted-foreground mt-1 mb-4">Add an address to speed up checkout.</p>
          <Button onClick={() => setIsAdding(true)} variant="outline">Add your first address</Button>
        </div>
      )}
    </div>
  );
}
