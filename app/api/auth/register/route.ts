import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password, whatsapp } = await request.json();

    if (!name || !email || !password || !whatsapp) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, whatsapp) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, whatsapp]
    );

    return NextResponse.json(
      { message: 'Registration successful' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 