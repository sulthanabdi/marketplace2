import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bill_link_id = searchParams.get('bill_link_id');

  if (!bill_link_id) {
    return NextResponse.json({ error: 'Bill link ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('flip_bill_link_id', bill_link_id)
    .single();

  if (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }

  return NextResponse.json({ status: transaction.status });
} 