import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    console.log('Webhook received:', new Date().toISOString());
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Verify signature
    const expectedSignature = crypto
      .createHash('sha512')
      .update(body.order_id + body.status_code + body.gross_amount + process.env.MIDTRANS_SERVER_KEY)
      .digest('hex');

    console.log('Signature verification:', {
      received: body.signature_key,
      expected: expectedSignature,
      matches: body.signature_key === expectedSignature
    });

    if (body.signature_key !== expectedSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { transaction_status, order_id } = body;
    console.log('Processing transaction:', { order_id, transaction_status });

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: transaction_status,
        payment_details: body
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    console.log('Transaction updated successfully');

    // If payment success, update product status
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      console.log('Payment successful, updating product status');
      const { data: transaction, error: trxError } = await supabase
        .from('transactions')
        .select('product_id, buyer_id, seller_id')
        .eq('order_id', order_id)
        .single();
      
      console.log('Transaction data:', { transaction, error: trxError });

      if (transaction) {
        const { error: productError } = await supabase
          .from('products')
          .update({ is_sold: true })
          .eq('id', transaction.product_id);
        
        console.log('Product update result:', { error: productError });

        // Insert notification for buyer
        const { error: notifErrorBuyer } = await supabase.from('notifications').insert({
          user_id: transaction.buyer_id,
          type: 'transaction',
          title: 'Pembayaran Berhasil',
          body: 'Transaksi Anda telah berhasil dan produk siap diambil.',
        });
        console.log('Buyer notification result:', { error: notifErrorBuyer });

        // Insert notification for seller
        const { error: notifErrorSeller } = await supabase.from('notifications').insert({
          user_id: transaction.seller_id,
          type: 'transaction',
          title: 'Produk Terjual',
          body: 'Produk Anda telah terjual dan pembayaran sudah diterima.',
        });
        console.log('Seller notification result:', { error: notifErrorSeller });
      } else {
        console.error('No transaction found for order_id:', order_id);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 