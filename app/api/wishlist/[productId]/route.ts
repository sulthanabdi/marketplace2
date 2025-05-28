import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const userId = cookies().get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove from wishlist
    await pool.execute(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, params.productId]
    );

    return NextResponse.json(
      { message: 'Product removed from wishlist' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 