import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    const { productId, receiverId, message } = await request.json();

    if (!productId || !receiverId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: receiverId,
        product_id: productId,
        message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error sending message' },
        { status: 500 }
      );
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'chat',
        message: `New message from ${session.user.email}`,
        link: `/chat/${productId}/${session.user.id}`,
      });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (name),
        receiver:receiver_id (name)
      `)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${session.user.id})`)
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching messages' },
        { status: 500 }
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 