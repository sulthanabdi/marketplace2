import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Package, ShoppingCart, MessageSquare } from 'lucide-react';

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}</p>
        </div>
        <Link href="/products/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
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
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No products yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
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
                        <CardTitle className="text-lg">{product.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {product.price.toLocaleString()}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                          {product.is_sold ? 'Sold' : 'Available'}
                        </p>
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
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No purchases yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases?.map((purchase) => (
                <Link key={purchase.id} href={`/transactions/${purchase.order_id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
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
                        <CardTitle className="text-lg">{purchase.products.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {purchase.amount.toLocaleString()}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                          Status: {purchase.status}
                        </p>
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
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No sales yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales?.map((sale) => (
                <Link key={sale.id} href={`/transactions/${sale.order_id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
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
                        <CardTitle className="text-lg">{sale.products.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Rp {sale.amount.toLocaleString()}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                          Status: {sale.status}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 