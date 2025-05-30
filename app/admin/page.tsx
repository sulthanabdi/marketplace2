'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Package, Wallet, AlertTriangle, RefreshCw } from 'lucide-react';
import AdminUsers from './components/AdminUsers';
import AdminProducts from './components/AdminProducts';
import AdminWithdrawals from './components/AdminWithdrawals';
import AdminReports from './components/AdminReports';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  pendingWithdrawals: number;
  pendingReports: number;
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    pendingWithdrawals: 0,
    pendingReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    loadStats();
  }, [dateRange]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'admin') {
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString().split('T')[0];
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        return yearAgo.toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  const loadStats = async () => {
    try {
      setIsRefreshing(true);
      const dateFilter = getDateFilter();
      const dateCondition = dateFilter ? `created_at >= '${dateFilter}'` : undefined;

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .filter(dateCondition || 'id', 'neq', '');

      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .filter(dateCondition || 'id', 'neq', '');

      // Get pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .filter(dateCondition || 'id', 'neq', '');

      // Get pending reports
      const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .filter(dateCondition || 'id', 'neq', '');

      setStats({
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingReports: pendingReports || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading || isRefreshing ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refresh Stats
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={0} icon={Users} />
          <StatCard title="Total Products" value={0} icon={Package} />
          <StatCard title="Pending Withdrawals" value={0} icon={Wallet} />
          <StatCard title="Pending Reports" value={0} icon={AlertTriangle} />
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>
          <TabsContent value="withdrawals">
            <AdminWithdrawals />
          </TabsContent>
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} />
        <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} icon={Wallet} />
        <StatCard title="Pending Reports" value={stats.pendingReports} icon={AlertTriangle} />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="products">
          <AdminProducts />
        </TabsContent>
        <TabsContent value="withdrawals">
          <AdminWithdrawals />
        </TabsContent>
        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>
      </Tabs>
    </div>
  );
} 