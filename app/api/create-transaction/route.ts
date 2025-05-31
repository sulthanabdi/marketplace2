import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Add CORS headers to the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    console.log('Starting transaction creation...');
    
    // Validate Midtrans environment variables
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.error('Midtrans environment variables not set');
      return NextResponse.json({ error: 'Payment system configuration error' }, { status: 500 });
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { productId } = body;
    
    console.log('Received request body:', body);
    console.log('Product ID:', productId);

    if (!productId) {
      console.error('Product ID is required');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400, headers }
      );
    }

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }
    
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', {
      id: session.user.id,
      email: session.user.email,
      metadata: session.user.user_metadata
    });

    // Get product details
    console.log('Fetching product with ID:', productId);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        image_url,
        condition,
        user_id,
        is_sold,
        created_at,
        seller:users (
          name,
          whatsapp
        )
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product error details:', {
        code: productError.code,
        message: productError.message,
        details: productError.details,
        hint: productError.hint
      });
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product) {
      console.error('Product not found in database:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers }
      );
    }

    console.log('Product found:', {
      id: product.id,
      title: product.title,
      price: product.price,
      seller: product.seller,
      is_sold: product.is_sold
    });

    // Check if product is already sold
    if (product.is_sold) {
      console.error('Product already sold:', productId);
      return NextResponse.json({ error: 'Product is no longer available' }, { status: 400 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    console.log('User query result:', {
      user,
      error: userError,
      userId: session.user.id
    });

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user) {
      console.error('User not found:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Snap instance
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    console.log('Midtrans config:', {
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY ? 'Set' : 'Not set',
      clientKey: process.env.MIDTRANS_CLIENT_KEY ? 'Set' : 'Not set'
    });

    // Cek transaksi pending untuk produk dan user ini
    const { data: existingPending, error: pendingError } = await supabase
      .from('transactions')
      .select('*')
      .eq('product_id', productId)
      .eq('buyer_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingError && pendingError.code !== 'PGRST116') {
      // PGRST116 = no rows found, aman diabaikan
      console.error('Error checking pending transaction:', pendingError);
      return NextResponse.json({ error: 'Failed to check pending transaction' }, { status: 500 });
    }

    if (existingPending) {
      // Sudah ada transaksi pending, kembalikan Snap token lama jika ada
      if (existingPending.snap_token) {
        return NextResponse.json({
          token: existingPending.snap_token,
          redirect_url: existingPending.snap_redirect_url || null
        });
      } else {
        // Snap token belum ada, lanjut proses seperti biasa (fallback)
      }
    }

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
      }],
      // Add sub-merchant information
      sub_merchant: {
        id: product.user_id, // Seller's sub-merchant ID
        name: product.seller.name,
        email: user.email,
        phone: product.seller.whatsapp
      }
    };

    console.log('Creating transaction with parameters:', parameter);

    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        product_id: productId,
        buyer_id: session.user.id,
        seller_id: product.user_id,
        amount: product.price,
        status: 'pending',
        order_id: parameter.transaction_details.order_id
      }])
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    console.log('Transaction created:', transaction);

    try {
    // Get Snap token
    const transactionToken = await snap.createTransaction(parameter);

      console.log('Snap token received:', {
        token: transactionToken.token,
        redirect_url: transactionToken.redirect_url
      });

    // Simpan snap_token dan snap_redirect_url ke transaksi
    await supabase
      .from('transactions')
      .update({
        snap_token: transactionToken.token,
        snap_redirect_url: transactionToken.redirect_url
      })
      .eq('order_id', parameter.transaction_details.order_id);

    return NextResponse.json({
      token: transactionToken.token,
      redirect_url: transactionToken.redirect_url
    });
    } catch (midtransError) {
      console.error('Midtrans error:', midtransError);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Transaction error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
} 