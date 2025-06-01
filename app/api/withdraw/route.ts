import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createFlipDisbursement } from '@/lib/flip';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, method, account, name } = await request.json();
    if (!amount || !method || !account || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize method to lowercase
    const normalizedMethod = typeof method === 'string' ? method.toLowerCase() : '';
    console.log('Withdrawal request:', { amount, method: normalizedMethod, account, name });

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert([
        {
          user_id: user.id,
          amount,
          status: 'pending',
          withdrawal_method: normalizedMethod,
          withdrawal_account: account,
          withdrawal_name: name
        }
      ])
      .select()
      .single();

    if (withdrawalError) {
      console.error('Withdrawal insert error:', withdrawalError);
      return NextResponse.json({ error: withdrawalError.message }, { status: 500 });
    }

    // Process withdrawal with Flip
    let flipResult;
    try {
      flipResult = await createFlipDisbursement({
        amount,
        bank_code: normalizedMethod,
        account_number: account,
        account_holder_name: name,
        remark: `Withdrawal for ${withdrawal.id}`,
      });
      console.log('Flip API response:', flipResult);
    } catch (flipError: any) {
      console.error('Flip API error:', flipError);
      // Update withdrawal status to rejected
      await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          disbursement_status: 'ERROR',
          disbursement_response: { error: flipError.message },
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);
      return NextResponse.json({ error: flipError.message }, { status: 500 });
    }

    // Update withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: flipResult.status === 'SUCCESS' ? 'completed' : 'rejected',
        flip_disbursement_id: flipResult.id,
        disbursement_status: flipResult.status,
        disbursement_response: flipResult,
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('Withdrawal update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, withdrawal_id: withdrawal.id, flip: flipResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process withdrawal' }, { status: 500 });
  }
} 