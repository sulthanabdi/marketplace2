import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Exchange code for session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      if (session?.user) {
        console.log('Creating user record for:', session.user.id);
        
        // Check if user already exists in users table
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing user:', checkError);
          return NextResponse.redirect(new URL('/auth/signin', request.url));
        }

        if (!existingUser) {
          // Create new user record
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
            console.error('Error creating user record:', insertError);
            return NextResponse.redirect(new URL('/auth/signin', request.url));
          }
          
          console.log('Successfully created user record');
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 