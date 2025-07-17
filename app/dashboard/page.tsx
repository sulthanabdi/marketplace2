'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Package, ShoppingCart, MessageSquare, TrendingUp, DollarSign, Users, Edit3, RefreshCw, Calendar, CreditCard } from 'lucide-react';
import { Database } from '@/types/supabase';
import { createFlipDisbursement } from '@/lib/flip';
import { User as SupabaseUser } from '@/types/supabase';

type User = SupabaseUser & { 
  whatsapp?: string | null;
  bank_code?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
};

const IS_TESTING = process.env.NEXT_PUBLIC_IS_TESTING === 'true';

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  withdrawal_method: string;
  withdrawal_account: string;
  withdrawal_name: string;
  created_at: string;
  flip_disbursement_id?: string;
  disbursement_status?: string;
  disbursement_response?: any;
  processed_at?: string;
}

function isWithdrawal(w: any): w is Withdrawal {
  return (
    w &&
    typeof w === 'object' &&
    typeof w.status === 'string' &&
    typeof w.amount === 'number' &&
    (w.status === 'completed' || (IS_TESTING && w.status === 'pending'))
  );
}

export default function DashboardPage() {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('');
  const [withdrawalAccount, setWithdrawalAccount] = useState('');
  const [withdrawalName, setWithdrawalName] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // Refactor fetchData so it can be called from useEffect and Refresh button
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
  }

      // Fetch user data
      const { data: userData } = await supabase
      .from('users')
      .select('*')
        .eq('id', user.id)
      .single();

      if (userData && typeof userData === 'object' && 'withdrawal_method' in userData) {
        const userTyped = userData as User;
        setUser(userTyped);
        setWithdrawalMethod(userTyped.withdrawal_method || '');
        setWithdrawalAccount(userTyped.withdrawal_account || '');
        setWithdrawalName(userTyped.withdrawal_name || '');
      }

      // Fetch products
      const { data: productsData } = await supabase
    .from('products')
    .select('*')
        .eq('user_id', user.id)
    .order('created_at', { ascending: false });

      if (Array.isArray(productsData)) {
        setProducts(productsData.filter(p => typeof p === 'object' && p !== null && 'id' in p));
      }

      // Fetch purchases
      const { data: purchasesData } = await supabase
    .from('transactions')
    .select(`
      *,
      products (
        id,
        title,
        price,
        image_url
      )
    `)
        .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

      if (Array.isArray(purchasesData)) {
        setPurchases(purchasesData.filter(p => typeof p === 'object' && p !== null && 'id' in p));
      }

      // Fetch sales
      const { data: salesData } = await supabase
    .from('transactions')
    .select(`
      *,
      products (
        id,
        title,
        price,
        image_url
      )
    `)
        .eq('seller_id', user.id)
        .in('status', ['settlement', 'completed', 'success'])
        .order('created_at', { ascending: false });

      if (Array.isArray(salesData)) {
        setSales(salesData.filter(s => typeof s === 'object' && s !== null && 'id' in s));
      }

      // Fetch withdrawal history
      const { data: withdrawalHistory } = await supabase
        .from('withdrawals')
        .select('*, flip_disbursement_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const validWithdrawals = Array.isArray(withdrawalHistory)
        ? withdrawalHistory
            .filter(w => typeof w === 'object' && w !== null && !('error' in w))
            .map(w => w as unknown as Withdrawal)
        : [];
      setWithdrawals(validWithdrawals);

      // Untuk testing: jika IS_TESTING, kurangi juga withdrawal pending
      const { data: allWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', user.id);

      const total = Array.isArray(allWithdrawals)
        ? (allWithdrawals.filter(isWithdrawal) as unknown as Withdrawal[])
            .reduce((sum, w) => sum + w.amount, 0)
        : 0;
      setTotalWithdrawn(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase, router]);

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const amount = parseInt(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    const totalSales = sales?.reduce((acc, sale) => acc + (sale.amount || 0), 0) || 0;
    if (amount > (totalSales - totalWithdrawn)) {
      setError('Withdrawal amount cannot exceed your balance');
      setLoading(false);
      return;
    }

    if (!withdrawalMethod || !withdrawalAccount || !withdrawalName) {
      setError('Please fill in all withdrawal details');
      setLoading(false);
      return;
    }

    // Validate withdrawal method
    const validMethods = ['bca', 'mandiri', 'bni', 'bri', 'gopay', 'ovo', 'dana'];
    const normalizedMethod = withdrawalMethod.toLowerCase();
    if (!validMethods.includes(normalizedMethod)) {
      setError('Invalid withdrawal method');
      setLoading(false);
      return;
    }

    // Validate account number for e-wallets
    if (['gopay', 'ovo', 'dana'].includes(normalizedMethod)) {
      if (!/^\d{10,15}$/.test(withdrawalAccount)) {
        setError('Account number for e-wallet must be a valid phone number (10-15 digits)');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: normalizedMethod,
          account: withdrawalAccount,
          name: withdrawalName,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to process withdrawal request');
        setLoading(false);
        return;
      }
      setSuccess('Withdrawal processed successfully');
      setWithdrawalAmount('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError('Failed to process withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSales = sales?.reduce((acc, sale) => acc + (sale.amount || 0), 0) || 0;
  const totalPurchases = purchases?.reduce((acc, purchase) => acc + purchase.amount, 0) || 0;
  const activeProducts = products?.filter(p => !p.is_sold).length || 0;
  const soldProducts = products?.filter(p => p.is_sold).length || 0;

  // Hitung balance
  const balance = (sales?.reduce((acc, sale) => acc + (sale.amount || 0), 0) || 0) - totalWithdrawn;

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome back, {user?.name || 'User'}! 👋</p>
            </div>
            <div className="flex gap-3">
              <Link href="/transactions">
                <Button variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
                  <TrendingUp className="h-4 w-4" />
                  Transaction History
                </Button>
              </Link>
              <Link href="/upload">
                <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <PlusCircle className="h-4 w-4" />
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{user?.name || 'User'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Email:</span> {user?.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">WhatsApp:</span> {user?.whatsapp || 'Not set'}
                      </div>
                    </div>
                    {user?.bank_code && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CreditCard className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Payment Method:</span> {user.bank_code}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">
                            {user.bank_code === 'GOPAY' || user.bank_code === 'OVO' || user.bank_code === 'DANA' 
                              ? 'Phone Number' 
                              : 'Account Number'}:
                          </span> {user.bank_account_number}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    Rp {totalSales.toLocaleString()}
                  </h3>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Purchases</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    Rp {totalPurchases.toLocaleString()}
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">+8% from last month</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Products</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {activeProducts}
                  </h3>
                  <p className="text-xs text-purple-600 mt-1">Currently listed</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sold Products</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {soldProducts}
                  </h3>
                  <p className="text-xs text-orange-600 mt-1">Total sold</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                  <Package className="h-4 w-4" />
                  My Products
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                  <ShoppingCart className="h-4 w-4" />
                  My Purchases
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                  <MessageSquare className="h-4 w-4" />
                  My Sales
                </TabsTrigger>
                <TabsTrigger value="withdrawal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                  <DollarSign className="h-4 w-4" />
                  Withdrawal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-6">
                {products?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Start your selling journey by adding your first product to the marketplace!</p>
                    <Link href="/upload">
                      <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <PlusCircle className="h-4 w-4" />
                        Add New Product
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`}>
                        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                          <div className="flex">
                            <div className="relative w-28 h-28 flex-shrink-0">
                              <Image
                                src={product.image_url}
                                alt={product.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            </div>
                            <div className="flex-1 p-5">
                              <CardTitle className="text-lg line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                                {product.title}
                              </CardTitle>
                              <CardDescription className="text-lg font-semibold text-gray-900 mb-3">
                                Rp {product.price.toLocaleString()}
                              </CardDescription>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  product.is_sold 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    product.is_sold ? 'bg-red-500' : 'bg-green-500'
                                  }`}></div>
                                  {product.is_sold ? 'Sold' : 'Available'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="space-y-6">
                {purchases?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                      <ShoppingCart className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchases yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Start shopping to see your purchase history here!</p>
                    <Link href="/products">
                      <Button variant="outline" className="shadow-lg hover:shadow-xl transition-all duration-200">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchases?.map((purchase) => (
                      <Link key={purchase.id} href={`/transactions/${purchase.order_id}`}>
                        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                          <div className="flex">
                            <div className="relative w-28 h-28 flex-shrink-0">
                              <Image
                                src={purchase.products.image_url}
                                alt={purchase.products.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            </div>
                            <div className="flex-1 p-5">
                              <CardTitle className="text-lg line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                                {purchase.products.title}
                              </CardTitle>
                              <CardDescription className="text-lg font-semibold text-gray-900 mb-3">
                                Rp {purchase.amount.toLocaleString()}
                              </CardDescription>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  purchase.status === 'success' 
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : purchase.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    purchase.status === 'success' ? 'bg-green-500' : 
                                    purchase.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}></div>
                                  {purchase.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-6">
                {sales?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6">
                      <MessageSquare className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No sales yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Start selling to see your sales history here!</p>
                    <Link href="/upload">
                      <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <PlusCircle className="h-4 w-4" />
                        Add New Product
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sales?.map((sale) => (
                      <Link key={sale.id} href={`/transactions/${sale.order_id}`}>
                        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                          <div className="flex">
                            <div className="relative w-28 h-28 flex-shrink-0">
                              <Image
                                src={sale.products.image_url}
                                alt={sale.products.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            </div>
                            <div className="flex-1 p-5">
                              <CardTitle className="text-lg line-clamp-2 mb-2 group-hover:text-green-600 transition-colors duration-200">
                                {sale.products.title}
                              </CardTitle>
                              <CardDescription className="text-lg font-semibold text-gray-900 mb-3">
                                Rp {sale.amount.toLocaleString()}
                              </CardDescription>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  sale.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : sale.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    sale.status === 'completed' ? 'bg-green-500' : 
                                    sale.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}></div>
                                  {sale.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdrawal" className="space-y-8">
                {/* Balance Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Available Balance</h2>
                        <p className="text-4xl font-bold">
                          Rp {new Intl.NumberFormat('id-ID').format(totalSales - totalWithdrawn)}
                        </p>
                        <p className="text-blue-100 mt-2">Ready for withdrawal</p>
                      </div>
                      <div className="p-6 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <DollarSign className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Withdrawal Form */}
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Request Withdrawal</CardTitle>
                    <CardDescription>Withdraw your earnings to your bank account or e-wallet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleWithdrawal} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                            Withdrawal Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                              type="number"
                              id="amount"
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              className="block w-full pl-12 pr-4 py-3 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                              placeholder="Enter amount"
                              min="1"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="method" className="block text-sm font-semibold text-gray-700 mb-2">
                            Withdrawal Method
                          </label>
                          <select
                            id="method"
                            value={withdrawalMethod}
                            onChange={(e) => setWithdrawalMethod(e.target.value)}
                            className="block w-full py-3 px-4 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            required
                          >
                            <option value="">Select method</option>
                            <option value="bca">BCA</option>
                            <option value="mandiri">Mandiri</option>
                            <option value="bni">BNI</option>
                            <option value="bri">BRI</option>
                            <option value="gopay">GoPay</option>
                            <option value="ovo">OVO</option>
                            <option value="dana">DANA</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="account" className="block text-sm font-semibold text-gray-700 mb-2">
                            Account Number
                          </label>
                          <input
                            type="text"
                            id="account"
                            value={withdrawalAccount}
                            onChange={(e) => setWithdrawalAccount(e.target.value)}
                            className="block w-full py-3 px-4 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Enter account number"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={withdrawalName}
                            onChange={(e) => setWithdrawalName(e.target.value)}
                            className="block w-full py-3 px-4 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Enter account holder name"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                          <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                          <p className="text-sm text-green-600 font-medium">{success}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!withdrawalAmount || !withdrawalMethod || !withdrawalAccount || !withdrawalName || balance < 0 || loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {loading ? 'Processing...' : 'Request Withdrawal'}
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {/* Withdrawal History */}
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Withdrawal History</CardTitle>
                        <CardDescription>Track your withdrawal requests and their status</CardDescription>
                      </div>
                      <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {withdrawals?.length > 0 ? (
                      <div className="space-y-4">
                        {(showAllWithdrawals ? withdrawals : withdrawals.slice(0, 3)).map((withdrawal) => (
                          <div
                            key={withdrawal.id}
                            className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <p className="text-2xl font-bold text-gray-900">
                                    Rp {new Intl.NumberFormat('id-ID').format(withdrawal.amount)}
                                  </p>
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    withdrawal.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                    {withdrawal.status === 'completed' ? '✅ Completed' :
                                     withdrawal.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(withdrawal.created_at).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    {withdrawal.withdrawal_method.toUpperCase()} • {withdrawal.withdrawal_account}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {withdrawals.length > 3 && (
                          <div className="text-center pt-4">
                            <button
                              className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline transition-colors duration-200"
                              onClick={() => setShowAllWithdrawals((v) => !v)}
                            >
                              {showAllWithdrawals ? 'Show Less' : `Show ${withdrawals.length - 3} More`}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                          <DollarSign className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No withdrawal history yet</p>
                        <p className="text-gray-400 text-sm mt-1">Your withdrawal requests will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 