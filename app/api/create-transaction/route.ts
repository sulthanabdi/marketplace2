import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createFlipPayment } from '@/lib/flip';
import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

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
      if (existingPending.flip_bill_link_id) {
        return NextResponse.json({
          bill_link_id: existingPending.flip_bill_link_id,
          qr_string: existingPending.flip_qr_string
        });
      } else {
        // Flip payment details belum ada, lanjut proses seperti biasa (fallback)
      }
    }

    // Create transaction parameters
    const orderId = `ORDER-${Date.now()}`;
    // Setup Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: product.price,
      },
      item_details: [
        {
          id: product.id,
          price: product.price,
          quantity: 1,
          name: product.title,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.whatsapp || user.phone || '',
      },
    };
    const snapResponse = await snap.createTransaction(parameter);
    // Simpan transaksi ke database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        product_id: productId,
        buyer_id: session.user.id,
        seller_id: product.user_id,
        amount: product.price,
        status: 'pending',
        order_id: orderId,
        midtrans_token: snapResponse.token,
        midtrans_redirect_url: snapResponse.redirect_url,
      }])
      .select()
      .single();
    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
    return NextResponse.json({ snap_token: snapResponse.token });
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