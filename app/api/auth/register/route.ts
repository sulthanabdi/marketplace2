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

    // Cek apakah email sudah terdaftar sebelumnya
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

    // Hash password untuk keamanan
    const hashedPassword = await hashPassword(password);

    // Insert user baru ke database
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, whatsapp) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, whatsapp]
    );

    return NextResponse.json(
      { message: 'Registration successful' },
      { status: 201 }
    );
  } catch (error) {
    // Log error untuk debugging
    console.error('Registration error:', error);
    // Return error internal server
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 