import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createXenditDisbursement } from '@/lib/xendit';

export async function POST(request: Request) {
  try {
    console.log('Webhook received:', new Date().toISOString());
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Ambil order_id dan status dari Midtrans
    const { order_id, transaction_status } = body;
    let status = 'pending';
    if (transaction_status === 'settlement') status = 'success';
    else if (transaction_status === 'expire' || transaction_status === 'cancel') status = 'failed';

    // Update transaction status berdasarkan order_id
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status,
        payment_details: body
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    console.log('Transaction updated successfully');

    // If payment success, update product status and process seller payment
    if (status === 'success') {
      console.log('Payment successful, updating product status and processing seller payment');
      // Debug: Query tanpa join ke products
      console.log('Mencari transaksi dengan order_id:', order_id);
      const { data: transactionNoJoin, error: trxErrorNoJoin } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', order_id)
        .single();
      console.log('Hasil query transaksi tanpa join:', { transactionNoJoin, error: trxErrorNoJoin });

      // Query dengan join ke products (hanya kolom yang ada)
      const { data: transaction, error: trxError } = await supabase
        .from('transactions')
        .select(`
          product_id, 
          buyer_id, 
          seller_id,
          amount,
          products (
            title,
            price,
            image_url,
            condition
          )
        `)
        .eq('order_id', order_id)
        .single();
      console.log('Hasil query transaksi dengan join:', { transaction, error: trxError });

      if (transaction) {
        // Update product status
        const { error: productError } = await supabase
          .from('products')
          .update({ is_sold: true })
          .eq('id', transaction.product_id);
        
        console.log('Product update result:', { error: productError });

        // Process seller payment through Xendit disbursement
        try {
          // Calculate seller amount (after platform fee)
          const platformFee = 0.05; // 5% platform fee
          const sellerAmount = transaction.amount * (1 - platformFee);

          // Ambil data seller dari tabel users
          const { data: sellerUser, error: sellerUserError } = await supabase
            .from('users')
            .select('name, bank_code, bank_account_number, bank_account_name')
            .eq('id', transaction.seller_id)
            .single();

          if (sellerUserError) {
            console.error('Error fetching seller data:', sellerUserError);
            throw new Error('Gagal mengambil data penjual');
          }

          if (!sellerUser) {
            console.error('Seller data not found');
            throw new Error('Data penjual tidak ditemukan');
          }

          // Validasi data rekening penjual
          if (!sellerUser.bank_code) {
            throw new Error('Kode bank penjual tidak ditemukan');
          }

          if (!sellerUser.bank_account_number) {
            throw new Error('Nomor rekening penjual tidak ditemukan');
          }

          if (!sellerUser.bank_account_name) {
            throw new Error('Nama pemilik rekening penjual tidak ditemukan');
          }

          // Create disbursement to seller via Xendit
          const disbursement = await createXenditDisbursement({
            amount: sellerAmount,
            bank_code: sellerUser.bank_code,
            account_number: sellerUser.bank_account_number,
            account_holder_name: sellerUser.bank_account_name,
            remark: `Payment for order ${transaction.order_id}`
          });

          console.log('Disbursement to seller result:', disbursement);

          // Update transaction with disbursement details
          await supabase
            .from('transactions')
            .update({ 
              seller_payment_status: 'processed',
              seller_payment_amount: sellerAmount,
              seller_payment_details: disbursement
            })
            .eq('order_id', order_id);

        } catch (disbursementError: any) {
          console.error('Error processing seller payment:', disbursementError);
          // Update transaction with error status
          await supabase
            .from('transactions')
            .update({ 
              seller_payment_status: 'failed',
              seller_payment_error: disbursementError.message
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