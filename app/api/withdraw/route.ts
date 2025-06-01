import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createXenditDisbursement } from '@/lib/xendit';

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

    // Process withdrawal with Xendit
    let xenditResult;
    try {
      xenditResult = await createXenditDisbursement({
        amount,
        bank_code: normalizedMethod,
        account_number: account,
        account_holder_name: name,
        remark: `Withdrawal for ${withdrawal.id}`,
      });
      console.log('Xendit API response:', xenditResult);
    } catch (xenditError: any) {
      console.error('Xendit API error:', xenditError);
      // Update withdrawal status to rejected
      await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          disbursement_status: 'ERROR',
          disbursement_response: { error: xenditError.message },
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);
      return NextResponse.json({ error: xenditError.message }, { status: 500 });
    }

    // Update withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: xenditResult.status === 'COMPLETED' ? 'completed' : 'pending',
        xendit_disbursement_id: xenditResult.id,
        disbursement_status: xenditResult.status,
        disbursement_response: xenditResult,
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('Withdrawal update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, withdrawal_id: withdrawal.id, xendit: xenditResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process withdrawal' }, { status: 500 });
  }
} 