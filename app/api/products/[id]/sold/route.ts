import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = cookies().get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns the product
    const [productRows] = await pool.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [params.id]
    );

    const products = productRows as any[];
    const product = products[0];

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.seller_id.toString() !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark product as sold
    await pool.execute(
      'UPDATE products SET is_sold = true WHERE id = ?',
      [params.id]
    );

    return NextResponse.json(
      { message: 'Product marked as sold' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking product as sold:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 