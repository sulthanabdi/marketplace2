"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function processWithdrawalAction(withdrawalId: string) {
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

  // Update withdrawal status
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'completed' })
    .eq('id', withdrawalId);

  if (error) throw error;
  return { success: true };
} 