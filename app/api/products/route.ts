import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, price, condition, image_url } = body;

    if (!title || !description || !price || !condition || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        title,
        description,
        price,
        condition,
        image_url,
        seller_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: error.message || 'Error creating product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const query = supabase
      .from('products')
      .select(`
        *,
        users:seller_id (name),
        wishlists!inner (user_id)
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    // Apply filters
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');

    if (minPrice) query.gte('price', minPrice);
    if (maxPrice) query.lte('price', maxPrice);
    if (condition) query.eq('condition', condition);
    if (search) query.ilike('title', `%${search}%`);

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching products' },
        { status: 500 }
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 