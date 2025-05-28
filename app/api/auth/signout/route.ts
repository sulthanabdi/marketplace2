import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = "force-dynamic";

export async function GET() {
  return handleSignOut();
}

export async function POST() {
  return handleSignOut();
}

async function handleSignOut() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Clear our custom cookie
  cookieStore.delete('user_id');
  
  // Redirect to home page
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
} 