'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, MapPin, Lock, Moon, Sun, LogOut, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';

export default function SettingsPage() {
  const { logout } = useUserStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const changePasswordMutation = useMutation({
    mutationFn: () => fetchApi('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully.');
      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 2000);
    },
    onError: (err) => {
      setPasswordError(getErrorMessage(err, 'Failed to change password'));
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-2xl mx-auto py-4 md:py-8 space-y-8">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Account Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-2">Account</h3>
          <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
            <Link href="/account/profile" className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Profile Information</h4>
                  <p className="text-sm text-muted-foreground font-medium">Update your name and email</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            
            <div className="h-px bg-border/50 mx-5" />
            
            <Link href="/account/addresses" className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Saved Addresses</h4>
                  <p className="text-sm text-muted-foreground font-medium">Manage your delivery locations</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-2">Security</h3>
          <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsPasswordDialogOpen(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Change Password</h4>
                  <p className="text-sm text-muted-foreground font-medium">Update your account password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* App Preferences Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-2">App Preferences</h3>
          <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Dark Mode</h4>
                  <p className="text-sm text-muted-foreground font-medium">Toggle dark mode appearance</p>
                </div>
              </div>
              <div className="w-12 h-6 rounded-full bg-muted border flex items-center p-1 cursor-pointer">
                <div className={`w-4 h-4 rounded-full bg-primary transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`} />
              </div>
            </button>
          </div>
        </div>
        
        {/* Logout */}
        <div className="pt-4">
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 border-2 font-bold text-lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>

      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsPasswordDialogOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
          setPasswordSuccess('');
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader className="mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold">Change Password</DialogTitle>
              <DialogDescription className="font-medium text-base mt-2">
                Enter your current password and a new one to update it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mb-8">
              {passwordError && (
                <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-sm font-bold text-center">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-green-500/15 text-green-600 text-sm font-bold text-center">
                  {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Current Password</Label>
                <Input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changePasswordMutation.isPending || !!passwordSuccess}
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">New Password</Label>
                <Input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changePasswordMutation.isPending || !!passwordSuccess}
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Confirm New Password</Label>
                <Input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changePasswordMutation.isPending || !!passwordSuccess}
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPasswordDialogOpen(false)}
                className="h-12 rounded-xl font-bold border-2 sm:w-1/2"
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 sm:w-1/2"
                disabled={changePasswordMutation.isPending || !!passwordSuccess}
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
