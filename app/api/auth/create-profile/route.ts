import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { id, name, email, whatsapp } = await request.json();

    if (!id || !name || !email || !whatsapp) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating user profile:', { id, name, email, whatsapp });

    const { error } = await supabase
      .from('users')
      .insert([
        {
          id,
          name,
          email,
          whatsapp,
        },
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Profile created successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 