import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Package, ShoppingCart, MessageSquare, TrendingUp, DollarSign, Users } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const { data: purchases } = await supabase
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
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });

  const { data: sales } = await supabase
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
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  // Calculate statistics
  const totalSales = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
  const totalPurchases = purchases?.reduce((acc, purchase) => acc + purchase.amount, 0) || 0;
  const activeProducts = products?.filter(p => !p.is_sold).length || 0;
  const soldProducts = products?.filter(p => p.is_sold).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <TabsList className="grid w-full grid-cols-3">
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
                                  purchase.status === 'completed' 
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 