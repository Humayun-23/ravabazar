'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { Address, AddressRequest } from '@/types/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Home, Building2, Building, Navigation } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

  const getAddressIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('home')) return <Home className="w-5 h-5" />;
    if (t.includes('work') || t.includes('office')) return <Building2 className="w-5 h-5" />;
    return <MapPin className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {!isAdding && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Saved Addresses</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage where we deliver your orders</p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="rounded-full shadow-lg shadow-primary/20 h-10 px-5 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </div>
      )}

      {isAdding && (
        <div className="bg-card shadow-xl shadow-black/5 rounded-3xl p-6 border mb-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
              <p className="text-sm text-muted-foreground font-medium">Please enter valid location details</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Address Label</Label>
              <Input 
                id="title" 
                placeholder="e.g. Home, Office, Mom's House"
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="street_address" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Street Address</Label>
              <div className="relative flex items-center group">
                <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Navigation className="w-4 h-4" />
                </div>
                <Input 
                  id="street_address" 
                  placeholder="Apartment, suite, building, street..."
                  value={formData.street_address} 
                  onChange={(e) => setFormData({...formData, street_address: e.target.value})} 
                  required 
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">City</Label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <Input 
                    id="city" 
                    placeholder="City"
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                    required 
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">State</Label>
                <Input 
                  id="state" 
                  placeholder="State"
                  value={formData.state} 
                  onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  required 
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postal_code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Postal Code</Label>
                <Input 
                  id="postal_code" 
                  placeholder="000000"
                  value={formData.postal_code} 
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})} 
                  required 
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base tracking-widest"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Country</Label>
                <Input 
                  id="country" 
                  value={formData.country} 
                  onChange={(e) => setFormData({...formData, country: e.target.value})} 
                  required 
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
            </div>
            
            <div className="flex items-center p-3 mt-4 rounded-xl border bg-card cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setFormData({...formData, is_default: !formData.is_default})}>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors",
                formData.is_default ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              )}>
                {formData.is_default && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Make this my default address</p>
                <p className="text-xs text-muted-foreground">We'll use this for faster checkout</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 h-12 rounded-xl font-bold border-2">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                {editingId ? 'Update Address' : 'Save Address'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid gap-4 relative z-0">
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={cn(
                "relative group rounded-3xl p-5 border transition-all duration-300",
                addr.is_default 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-card hover:border-primary/50 hover:shadow-md"
              )}
            >
              {addr.is_default && (
                <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Default
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  addr.is_default ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                )}>
                  {getAddressIcon(addr.title)}
                </div>
                
                <div className="flex-1 pr-12">
                  <h4 className="font-bold text-foreground text-lg mb-1">{addr.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {addr.street_address}<br/>
                    {addr.city}, {addr.state} {addr.postal_code}<br/>
                    {addr.country}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted font-semibold rounded-xl h-10" 
                  onClick={() => handleEdit(addr)}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button 
                  variant="ghost" 
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold rounded-xl h-10"
                  onClick={() => deleteMutation.mutate(addr.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !isAdding && (
        <div className="text-center py-16 px-4 bg-muted/30 rounded-3xl border border-dashed">
          <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No addresses saved</h3>
          <p className="text-muted-foreground mt-2 mb-8 font-medium max-w-xs mx-auto">
            Save your home or office address to speed up your checkout experience.
          </p>
          <Button onClick={() => setIsAdding(true)} className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Address
          </Button>
        </div>
      )}
    </div>
  );
}
