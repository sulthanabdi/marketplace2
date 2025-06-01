import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createFlipDisbursement } from '@/lib/flip';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const webhookToken = request.headers.get('x-callback-token');
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    // Verifikasi token webhook
    if (!webhookToken || webhookToken !== expectedToken) {
      console.error('Invalid Xendit webhook token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    console.log('Xendit webhook received:', new Date().toISOString());
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    // Xendit payload: id, status, external_id, etc
    const { id, status, external_id } = body;
    if (!id || !external_id) {
      return NextResponse.json({ error: 'Missing id or external_id' }, { status: 400 });
    }

    // Update withdrawal status in Supabase
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: status === 'COMPLETED' ? 'completed' : status === 'FAILED' ? 'rejected' : 'pending',
        disbursement_status: status,
        disbursement_response: body,
        processed_at: new Date().toISOString(),
        xendit_disbursement_id: id,
      })
      .eq('xendit_disbursement_id', id);

    if (updateError) {
      console.error('Error updating withdrawal:', updateError);
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 });
    }

    console.log('Withdrawal updated successfully for disbursement_id:', id);
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Xendit webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 