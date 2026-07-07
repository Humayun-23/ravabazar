'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { DashboardStats } from '@/types/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError('Failed to load dashboard statistics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted animate-pulse rounded-xl h-32 border" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`$${stats.total_revenue.toFixed(2)}`} 
            icon="💰" 
          />
          <StatCard 
            title="Total Orders" 
            value={stats.total_orders.toString()} 
            icon="🛒" 
          />
          <StatCard 
            title="Active Customers" 
            value={stats.total_users.toString()} 
            icon="👥" 
          />
          <StatCard 
            title="Active Products" 
            value={stats.active_products.toString()} 
            icon="📦" 
          />
        </div>
      ) : null}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Activity logs will appear here...</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Shortcuts will appear here...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-4">
        <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
      </div>
    </div>
  );
}
