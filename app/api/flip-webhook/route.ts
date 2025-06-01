import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createFlipDisbursement } from '@/lib/flip';

export async function POST(request: Request) {
  try {
    console.log('Flip webhook received:', new Date().toISOString());
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    const { bill_link_id, status } = body;
    console.log('Processing Flip webhook:', { bill_link_id, status });

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: status,
        payment_details: body
      })
      .eq('flip_bill_link_id', bill_link_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    console.log('Transaction updated successfully');

    // If payment success, update product status and process seller payment
    if (status === 'success') {
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
        .eq('flip_bill_link_id', bill_link_id)
        .single();
      
      console.log('Transaction data:', { transaction, error: trxError });

      if (transaction) {
        // Update product status
        const { error: productError } = await supabase
          .from('products')
          .update({ is_sold: true })
          .eq('id', transaction.product_id);
        
        console.log('Product update result:', { error: productError });

        // Process seller payment through Flip disbursement
        try {
          // Calculate seller amount (after platform fee)
          const platformFee = 0.05; // 5% platform fee
          const sellerAmount = transaction.amount * (1 - platformFee);

          // Create disbursement to seller
          const disbursement = await createFlipDisbursement({
            amount: sellerAmount,
            bank_code: 'bca', // Assuming seller's bank is BCA
            account_number: transaction.products.seller_phone,
            account_holder_name: transaction.products.seller_name,
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
            .eq('flip_bill_link_id', bill_link_id);

        } catch (disbursementError: any) {
          console.error('Error processing seller payment:', disbursementError);
          // Update transaction with error status
          await supabase
            .from('transactions')
            .update({ 
              seller_payment_status: 'failed',
              seller_payment_error: disbursementError.message
            })
            .eq('flip_bill_link_id', bill_link_id);
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
        console.error('No transaction found for bill_link_id:', bill_link_id);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 