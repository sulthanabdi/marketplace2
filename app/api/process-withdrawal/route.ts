import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

// Create Snap API instance
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get withdrawal details from request
    const { withdrawalId, amount, method, account, name } = await request.json();

    // Process withdrawal with Midtrans
    const parameter = {
      transaction_details: {
        order_id: `WD-${withdrawalId}`,
        gross_amount: amount
      },
      customer_details: {
        first_name: name,
        email: user.email
      },
      bank_transfer: {
        bank: method === 'bank_transfer' ? 'bca' : 'gopay',
        va_number: account
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Update withdrawal status in database
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        midtrans_transaction_id: transaction.transaction_id
      })
      .eq('id', withdrawalId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction.transaction_id
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 