import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { productId } = await request.json();

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Snap instance
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Create transaction parameters
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${Date.now()}`,
        gross_amount: product.price
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || ''
      },
      item_details: [{
        id: product.id,
        price: product.price,
        quantity: 1,
        name: product.title
      }]
    };

    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        product_id: productId,
        buyer_id: session.user.id,
        seller_id: product.seller_id,
        amount: product.price,
        status: 'pending',
        order_id: parameter.transaction_details.order_id
      }])
      .select()
      .single();

    if (transactionError) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Get Snap token
    const transactionToken = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transactionToken.token,
      redirect_url: transactionToken.redirect_url
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 