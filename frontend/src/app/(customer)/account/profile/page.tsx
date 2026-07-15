'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { User } from '@/types/auth';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, Edit2, Check, X, Camera } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

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
      const timeoutId = window.setTimeout(() => {
        setUserState(user);
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || ''
        });
      }, 0);
      return () => window.clearTimeout(timeoutId);
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
    onError: (err) => {
      setError(getErrorMessage(err, 'Failed to update profile'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8 space-y-8 w-full max-w-md mx-auto">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-4 w-full">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <div className="text-destructive text-center py-8">Failed to load profile details.</div>;
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="w-full max-w-lg mx-auto py-4 md:py-8 space-y-8">
      
      {/* Header & Avatar */}
      <div className="flex flex-col items-center text-center relative group">
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-full"
            aria-label="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-md mb-4 ring-4 ring-background">
            {initials}
          </div>
          {isEditing && (
            <div className="absolute bottom-4 right-0 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-sm border text-muted-foreground cursor-pointer hover:text-primary">
              <Camera className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          {user.first_name} {user.last_name}
        </h2>
        <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
      </div>

      {success && (
        <div className="p-3 text-center rounded-xl bg-green-500/15 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-3 text-center rounded-xl bg-destructive/15 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-background rounded-3xl border shadow-sm overflow-hidden divide-y">
          
          {/* First Name */}
          <div className="flex items-center px-4 py-3 group focus-within:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4 text-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="first_name" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                First Name
              </Label>
              {isEditing ? (
                <input 
                  id="first_name" 
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-foreground font-medium outline-none"
                  placeholder="First Name"
                />
              ) : (
                <div className="text-foreground font-medium truncate">{user.first_name}</div>
              )}
            </div>
          </div>

          {/* Last Name */}
          <div className="flex items-center px-4 py-3 group focus-within:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4 text-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="last_name" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                Last Name
              </Label>
              {isEditing ? (
                <input 
                  id="last_name" 
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-foreground font-medium outline-none"
                  placeholder="Last Name"
                />
              ) : (
                <div className="text-foreground font-medium truncate">{user.last_name}</div>
              )}
            </div>
          </div>
          
          {/* Email */}
          <div className="flex items-center px-4 py-3 group focus-within:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mr-4 text-orange-500">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="email" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                Email
              </Label>
              {isEditing ? (
                <input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-foreground font-medium outline-none"
                  placeholder="Email address"
                />
              ) : (
                <div className="text-foreground font-medium truncate">{user.email}</div>
              )}
            </div>
          </div>
          
          {/* Phone (Read Only) */}
          <div className="flex items-center px-4 py-3 group opacity-80">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mr-4 text-green-500">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                Phone Number
              </Label>
              <div className="text-foreground font-medium truncate">{user.phone}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-3 pt-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 rounded-full h-12 border-2"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email || ''
                });
              }} 
              disabled={updateMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 rounded-full h-12"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
