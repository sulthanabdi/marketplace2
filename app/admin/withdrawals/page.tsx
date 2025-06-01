'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from '@/types/supabase';
import { processWithdrawalAction } from './actions';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  withdrawal_method: string;
  withdrawal_account: string;
  withdrawal_name: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Query user yang login untuk cek role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      let isAdmin = false;
      if (userData && typeof userData === 'object' && 'role' in userData) {
        isAdmin = (userData as { role: string }).role === 'admin';
      } else {
        isAdmin = false;
      }
      if (!isAdmin) {
        router.push('/');
        return;
      }

      // Query semua withdrawal
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      if (withdrawalError) throw withdrawalError;

      // Query semua user
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email');
      if (usersError) throw usersError;

      // Join user info ke withdrawal
      const validWithdrawals: any[] = Array.isArray(withdrawalData) ? withdrawalData.filter(w => typeof w === 'object' && w !== null && 'id' in w && 'user_id' in w) : [];
      const validUsers: any[] = Array.isArray(usersData) ? usersData.filter(u => typeof u === 'object' && u !== null && 'id' in u) : [];
      const withdrawalsWithUser = validWithdrawals.map(w => ({
        ...w,
        user: validUsers.find(u => u.id === w.user_id) || { name: 'Unknown', email: '-' }
      }));

      setWithdrawals(withdrawalsWithUser);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Call server action with full withdrawal object for Flip payout
      await processWithdrawalAction({
        id: withdrawal.id,
        amount: withdrawal.amount,
        withdrawal_method: withdrawal.withdrawal_method,
        withdrawal_account: withdrawal.withdrawal_account,
        withdrawal_name: withdrawal.withdrawal_name,
      });

      setSuccess('Withdrawal processed successfully');
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', withdrawal.id);

      if (updateError) throw updateError;

      setSuccess('Withdrawal request rejected');
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      setError('Failed to reject withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="mt-2 text-gray-600">Manage user withdrawal requests</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid gap-6">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Rp {new Intl.NumberFormat('id-ID').format(withdrawal.amount)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested by: {withdrawal.user.name} ({withdrawal.user.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      {withdrawal.withdrawal_method === 'bank_transfer' ? 'Bank Transfer' : 'E-Wallet'}: {withdrawal.withdrawal_account}
                    </p>
                    <p className="text-sm text-gray-500">
                      Account Holder: {withdrawal.withdrawal_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Requested on: {new Date(withdrawal.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        withdrawal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleProcessWithdrawal(withdrawal)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Process
                        </Button>
                        <Button
                          onClick={() => handleRejectWithdrawal(withdrawal)}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          disabled={loading}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {withdrawals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No withdrawal requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 