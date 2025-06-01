'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Package, ShoppingCart, MessageSquare, TrendingUp, DollarSign, Users } from 'lucide-react';
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

    return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">WhatsApp:</span> {user?.whatsapp || 'Not set'}
                  </p>
                  {user?.bank_code && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium text-gray-900">Payment Information</h3>
                      <p className="text-gray-600">
                        <span className="font-medium">Method:</span> {user.bank_code}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">
                          {user.bank_code === 'GOPAY' || user.bank_code === 'OVO' || user.bank_code === 'DANA' 
                            ? 'Phone Number' 
                            : 'Account Number'}:
                        </span> {user.bank_account_number}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Name:</span> {user.bank_account_name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/transactions">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Transaction History
              </Button>
          </Link>
        <Link href="/upload">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    Rp {totalSales.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    Rp {totalPurchases.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {activeProducts}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sold Products</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {soldProducts}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        <Card className="bg-white">
          <CardContent className="p-6">
      <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Products
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            My Purchases
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Sales
          </TabsTrigger>
                <TabsTrigger value="withdrawal" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Withdrawal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {products?.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No products yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start selling by adding your first product!</p>
                    <div className="mt-6">
                      <Link href="/upload">
                        <Button className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Add New Product
                        </Button>
                      </Link>
                    </div>
                  </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover rounded-l-lg"
                        />
          </div>
                      <div className="flex-1 p-4">
                              <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {product.price.toLocaleString()}
                        </CardDescription>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.is_sold 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
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

        <TabsContent value="purchases" className="space-y-4">
          {purchases?.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No purchases yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start shopping to see your purchases here!</p>
                    <div className="mt-6">
                      <Link href="/products">
                        <Button variant="outline">Browse Products</Button>
                      </Link>
                    </div>
                  </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases?.map((purchase) => (
                <Link key={purchase.id} href={`/transactions/${purchase.order_id}`}>
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                          src={purchase.products.image_url}
                          alt={purchase.products.title}
                          fill
                          className="object-cover rounded-l-lg"
                        />
                      </div>
                      <div className="flex-1 p-4">
                              <CardTitle className="text-lg line-clamp-1">{purchase.products.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {purchase.amount.toLocaleString()}
                        </CardDescription>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.status === 'success' 
                                    ? 'bg-green-100 text-green-800'
                                    : purchase.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
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

        <TabsContent value="sales" className="space-y-4">
          {sales?.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No sales yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start selling to see your sales here!</p>
                    <div className="mt-6">
                      <Link href="/upload">
                        <Button className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Add New Product
                        </Button>
                      </Link>
                    </div>
                  </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales?.map((sale) => (
                <Link key={sale.id} href={`/transactions/${sale.order_id}`}>
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                          src={sale.products.image_url}
                          alt={sale.products.title}
                    fill
                          className="object-cover rounded-l-lg"
                  />
                </div>
                      <div className="flex-1 p-4">
                              <CardTitle className="text-lg line-clamp-1">{sale.products.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {sale.amount.toLocaleString()}
                        </CardDescription>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sale.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : sale.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
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

              <TabsContent value="withdrawal" className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <div className="bg-primary/10 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Available Balance</h2>
                    <p className="text-3xl font-bold text-primary">
                      Rp {new Intl.NumberFormat('id-ID').format(totalSales - totalWithdrawn)}
                    </p>
                  </div>

                  <form onSubmit={handleWithdrawal} className="space-y-6">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Withdrawal Amount
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="amount"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="Enter amount"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                        Withdrawal Method
                      </label>
                      <div className="mt-1">
                        <select
                          id="method"
                          value={withdrawalMethod}
                          onChange={(e) => setWithdrawalMethod(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          required
                        >
                          <option value="">Select bank</option>
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

                    <div>
                      <label htmlFor="account" className="block text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="account"
                          value={withdrawalAccount}
                          onChange={(e) => setWithdrawalAccount(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="Enter account number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Account Holder Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="name"
                          value={withdrawalName}
                          onChange={(e) => setWithdrawalName(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="Enter account holder name"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="rounded-md bg-green-50 p-4">
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!withdrawalAmount || !withdrawalMethod || !withdrawalAccount || !withdrawalName}
                      className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Request Withdrawal
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Withdrawal History</h2>
                    <Button onClick={fetchData} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                  {withdrawals?.length > 0 ? (
                    <div className="space-y-4">
                      {(showAllWithdrawals ? withdrawals : withdrawals.slice(0, 3)).map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                        >
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              Rp {new Intl.NumberFormat('id-ID').format(withdrawal.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(withdrawal.created_at).toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {withdrawal.withdrawal_method.toUpperCase()} • {withdrawal.withdrawal_account}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold
                            ${withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                              withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}>
                            {withdrawal.status === 'completed' ? '✔️ Completed' :
                              withdrawal.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                          </span>
                        </div>
                      ))}
                      {withdrawals.length > 3 && (
                        <button
                          className="mt-2 text-primary underline text-sm"
                          onClick={() => setShowAllWithdrawals((v) => !v)}
                        >
                          {showAllWithdrawals ? 'Show Less' : 'Load More'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No withdrawal history</div>
                  )}
                </div>
        </TabsContent>
      </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 