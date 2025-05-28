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
      *,
      product:products (
        *,
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

  if (isValidTransaction(transaction)) {
    return transaction;
  }
  return null;
}

function isValidTransaction(transaction: any): transaction is Transaction {
  return transaction && typeof transaction === 'object' && typeof transaction.id === 'string' && typeof transaction.order_id === 'string';
}

export default async function TransactionPage({ params }: { params: { orderId: string } }) {
  const transaction = await getTransaction(params.orderId);

  if (isValidTransaction(transaction)) {
    return transaction;
  }

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