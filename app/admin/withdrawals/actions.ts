"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createFlipDisbursement } from '@/lib/flip';

export async function processWithdrawalAction(withdrawal: {
  id: string;
  amount: number;
  withdrawal_method: string;
  withdrawal_account: string;
  withdrawal_name: string;
}) {
  const supabase = createServerActionClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  let isAdmin = false;
  if (userData && typeof userData === 'object' && 'role' in userData) {
    isAdmin = (userData as { role: string }).role === 'admin';
  }
  if (!isAdmin) throw new Error('Forbidden');

  try {
  // Panggil API Flip
  const flipResult = await createFlipDisbursement({
    amount: withdrawal.amount,
      bank_code: withdrawal.withdrawal_method,
    account_number: withdrawal.withdrawal_account,
    account_holder_name: withdrawal.withdrawal_name,
    remark: `Withdrawal for ${withdrawal.id}`,
  });

    console.log('Flip disbursement result:', flipResult);

  // Simpan response Flip ke database
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
      console.error('Error updating withdrawal:', updateError);
      throw new Error('Failed to update withdrawal status');
    }

  return flipResult;
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    
    // Update withdrawal status to failed
    await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        disbursement_status: 'ERROR',
        disbursement_response: { error: error instanceof Error ? error.message : 'Unknown error' },
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id);

    throw error;
  }
} 