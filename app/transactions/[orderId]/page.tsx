export const dynamic = "force-dynamic";

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface Transaction {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  created_at: string;
  product: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    seller: {
      name: string;
      whatsapp: string;
    };
  };
  buyer: {
    name: string;
    email: string;
  };
}

async function getTransaction(orderId: string): Promise<Transaction | null> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select(`
      id,
      order_id,
      status,
      amount,
      created_at,
      product:products (
        id,
        title,
        description,
        image_url,
        seller:users (
          name,
          whatsapp
        )
      ),
      buyer:users!buyer_id (
        name,
        email
      )
    `)
    .eq('order_id', orderId)
    .single();

  if (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }

  return transaction as unknown as Transaction;
}

export default async function TransactionPage({ params }: { params: { orderId: string } }) {
  const transaction = await getTransaction(params.orderId);

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Transaction not found</h1>
          <Link href="/" className="mt-4 text-primary hover:text-primary/90">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Details</h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Product</h2>
                <div className="flex items-start space-x-4">
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                      src={transaction.product.image_url || '/placeholder.png'}
                      alt={transaction.product.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{transaction.product.title}</h3>
                    <p className="text-sm text-gray-500">{transaction.product.description}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Transaction Info</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{transaction.order_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{transaction.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Seller</h2>
                <p className="text-sm text-gray-900">{transaction.product.seller.name}</p>
                <p className="text-sm text-gray-500">{transaction.product.seller.whatsapp}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Buyer</h2>
                <p className="text-sm text-gray-900">{transaction.buyer.name}</p>
                <p className="text-sm text-gray-500">{transaction.buyer.email}</p>
              </div>
            </div>

            {/* Instruksi pengambilan barang & tombol chat penjual */}
            {transaction.status === 'success' && transaction.product.seller.whatsapp && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h2 className="text-lg font-semibold mb-2 text-blue-800">Instruksi Pengambilan Barang</h2>
                <p className="mb-3 text-blue-700">Pembayaran berhasil! Silakan hubungi penjual untuk janjian pengambilan barang secara langsung.</p>
                <a
                  href={`https://wa.me/${transaction.product.seller.whatsapp.replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Chat Penjual via WhatsApp
                </a>
              </div>
            )}

            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 