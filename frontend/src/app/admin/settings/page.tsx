'use client';

import { useState } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/errors';
import { useAdminStore } from '@/store/adminStore';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const admin = useAdminStore((state) => state.admin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await adminApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin profile and security.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={`${admin?.first_name || ''} ${admin?.last_name || ''}`} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={admin?.email || ''} disabled />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={admin?.role || 'manager'} disabled className="capitalize" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Profile information can only be modified by a superadmin or via database access currently.
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/15 text-green-600 p-3 rounded-md text-sm">
                {success}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
