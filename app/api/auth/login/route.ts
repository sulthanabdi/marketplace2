import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyPassword } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const users = rows as any[];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    cookies().set('user_id', user.id.toString(), {
      httpOnly: true,
      secure: false, // Allow cookies in development
      sameSite: 'lax',
      path: '/', // Ensure cookie is available across all paths
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 