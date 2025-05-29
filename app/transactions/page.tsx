import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function TransactionsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return <div className="container mx-auto p-8">Silakan login untuk melihat riwayat transaksi.</div>;
  }

  // Query transaksi sebagai pembeli
  const { data: purchases } = await supabase
    .from('transactions')
    .select(`*, products (id, title, image_url)`) // sesuaikan dengan struktur tabel Anda
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });

  // Query transaksi sebagai penjual
  const { data: sales } = await supabase
    .from('transactions')
    .select(`*, products (id, title, image_url)`) // sesuaikan dengan struktur tabel Anda
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Riwayat Transaksi</h1>
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Pembelian</TabsTrigger>
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          {purchases && purchases.length > 0 ? (
            <div className="grid gap-4">
              {purchases.map((trx) => (
                <Link key={trx.id} href={`/transactions/${trx.order_id}`} className="block border rounded p-4 hover:shadow">
                  <div className="flex items-center gap-4">
                    {trx.products?.image_url && (
                      <img src={trx.products.image_url} alt={trx.products.title} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{trx.products?.title}</div>
                      <div className="text-sm text-gray-500">Status: <span className="font-bold">{trx.status}</span></div>
                      <div className="text-sm text-gray-500">Tanggal: {new Date(trx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="font-bold text-blue-600">Rp {trx.amount?.toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-8 text-center">Belum ada transaksi pembelian.</div>
          )}
        </TabsContent>
        <TabsContent value="sales">
          {sales && sales.length > 0 ? (
            <div className="grid gap-4">
              {sales.map((trx) => (
                <Link key={trx.id} href={`/transactions/${trx.order_id}`} className="block border rounded p-4 hover:shadow">
                  <div className="flex items-center gap-4">
                    {trx.products?.image_url && (
                      <img src={trx.products.image_url} alt={trx.products.title} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{trx.products?.title}</div>
                      <div className="text-sm text-gray-500">Status: <span className="font-bold">{trx.status}</span></div>
                      <div className="text-sm text-gray-500">Tanggal: {new Date(trx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="font-bold text-green-600">Rp {trx.amount?.toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-8 text-center">Belum ada transaksi penjualan.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 