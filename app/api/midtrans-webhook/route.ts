import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import midtransClient from 'midtrans-client';

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

    // If payment success, update product status and process seller payment
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      console.log('Payment successful, updating product status and processing seller payment');
      const { data: transaction, error: trxError } = await supabase
        .from('transactions')
        .select(`
          product_id, 
          buyer_id, 
          seller_id,
          amount,
          products (
            seller_name,
            seller_email,
            seller_phone
          )
        `)
        .eq('order_id', order_id)
        .single();
      
      console.log('Transaction data:', { transaction, error: trxError });

      if (transaction) {
        // Update product status
        const { error: productError } = await supabase
          .from('products')
          .update({ is_sold: true })
          .eq('id', transaction.product_id);
        
        console.log('Product update result:', { error: productError });

        // Process seller payment through Midtrans
        try {
          const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
          });

          // Calculate seller amount (after platform fee)
          const platformFee = 0.05; // 5% platform fee
          const sellerAmount = transaction.amount * (1 - platformFee);

          // Create transfer to seller
          const transferResponse = await snap.createTransfer({
            sender_bank: "bca", // Your platform's bank
            account_number: transaction.products.seller_phone, // Seller's bank account
            account_holder: transaction.products.seller_name,
            amount: sellerAmount,
            transfer_type: "bank_transfer"
          });

          console.log('Transfer to seller result:', transferResponse);

          // Update transaction with transfer details
          await supabase
            .from('transactions')
            .update({ 
              seller_payment_status: 'processed',
              seller_payment_amount: sellerAmount,
              seller_payment_details: transferResponse
            })
            .eq('order_id', order_id);

        } catch (transferError) {
          console.error('Error processing seller payment:', transferError);
          // Update transaction with error status
          await supabase
            .from('transactions')
            .update({ 
              seller_payment_status: 'failed',
              seller_payment_error: transferError.message
            })
            .eq('order_id', order_id);
        }

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
          body: 'Produk Anda telah terjual dan pembayaran akan diproses dalam 1x24 jam.',
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