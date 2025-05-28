import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// Get user's wishlist
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: wishlist, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          *,
          users:seller_id (name)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add product to wishlist
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already in wishlist
    const { data: existingWishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .single();

    if (existingWishlist) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const { data: wishlist, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: session.user.id,
        product_id: productId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error adding to wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 