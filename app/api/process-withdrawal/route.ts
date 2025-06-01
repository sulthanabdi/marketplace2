import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createFlipDisbursement } from '@/lib/flip';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get withdrawal details from request
    const { withdrawalId, amount, method, account, name } = await request.json();

    // Process withdrawal with Flip disbursement
    const disbursement = await createFlipDisbursement({
      amount,
      bank_code: method === 'bank_transfer' ? 'bca' : 'gopay',
      account_number: account,
      account_holder_name: name,
      remark: `Withdrawal for ${name}`
    });

    // Update withdrawal status in database
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        flip_disbursement_id: disbursement.id
      })
      .eq('id', withdrawalId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      disbursement_id: disbursement.id
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 