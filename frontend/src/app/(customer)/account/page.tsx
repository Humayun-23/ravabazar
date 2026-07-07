'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { User } from '@/types/auth';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

export default function AccountProfilePage() {
  const queryClient = useQueryClient();
  const setUserState = useUserStore(state => state.setUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => fetchApi('/users/me'),
  });

  useEffect(() => {
    if (user) {
      setUserState(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user, setUserState]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => fetchApi('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'me'], updatedUser);
      setUserState(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Profile Details</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2 sm:col-span-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2 sm:col-span-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <div className="text-destructive">Failed to load profile details.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profile Details</h2>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-md bg-green-500/15 text-green-600 dark:text-green-400 text-sm font-medium">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input 
              id="first_name" 
              value={isEditing ? formData.first_name : user.first_name} 
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              readOnly={!isEditing} 
              className={!isEditing ? "bg-muted cursor-default focus-visible:ring-0" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input 
              id="last_name" 
              value={isEditing ? formData.last_name : user.last_name} 
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted cursor-default focus-visible:ring-0" : ""}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={isEditing ? formData.email : user.email} 
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted cursor-default focus-visible:ring-0" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Cannot be changed)</Label>
          <Input 
            id="phone" 
            value={user.phone} 
            readOnly
            className="bg-muted cursor-not-allowed opacity-70"
          />
        </div>

        {isEditing && (
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
