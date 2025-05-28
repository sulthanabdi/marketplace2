import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fixing user data for:', session.user.id);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
    }

    if (!existingUser) {
      // Create user record
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            phone: session.user.user_metadata.phone || '',
            whatsapp: session.user.user_metadata.phone || '',
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      return NextResponse.json({ message: 'User created successfully' });
    }

    // Update existing user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: session.user.email,
        name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
        phone: session.user.user_metadata.phone || '',
        whatsapp: session.user.user_metadata.phone || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error fixing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 