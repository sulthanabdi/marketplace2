export const dynamic = "force-dynamic";

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';
import { CreditCard, Smartphone, HelpCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type BankType = 'bank' | 'ewallet';

interface Bank {
  code: string;
  name: string;
  accountLength: number;
  type: BankType;
  icon: string;
}

// List of supported banks and e-wallets with icons
const SUPPORTED_BANKS: Bank[] = [
  { code: 'BCA', name: 'Bank Central Asia', accountLength: 10, type: 'bank', icon: '🏦' },
  { code: 'BNI', name: 'Bank Negara Indonesia', accountLength: 10, type: 'bank', icon: '🏦' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia', accountLength: 15, type: 'bank', icon: '🏦' },
  { code: 'MANDIRI', name: 'Bank Mandiri', accountLength: 13, type: 'bank', icon: '🏦' },
  { code: 'BSI', name: 'Bank Syariah Indonesia', accountLength: 10, type: 'bank', icon: '🏦' },
  { code: 'GOPAY', name: 'GoPay', accountLength: 10, type: 'ewallet', icon: '🟢' },
  { code: 'OVO', name: 'OVO', accountLength: 10, type: 'ewallet', icon: '🟣' },
  { code: 'DANA', name: 'DANA', accountLength: 10, type: 'ewallet', icon: '🔵' },
];

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studentId, setStudentId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<BankType>('bank');

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (isValidProfile(profile)) {
          setName(profile.name || '');
          setWhatsapp(profile.whatsapp || '');
          setBio(profile.bio || '');
          setFaculty(profile.faculty || '');
          setStudentId(profile.student_id || '');
          setBankCode(profile.bank_code || '');
          setBankAccountNumber(profile.bank_account_number || '');
          setBankAccountName(profile.bank_account_name || '');
        } else {
          setName('');
          setWhatsapp('');
          setBio('');
          setFaculty('');
          setStudentId('');
          setBankCode('');
          setBankAccountNumber('');
          setBankAccountName('');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const validateBankAccount = (code: string, number: string): boolean => {
    const bank = SUPPORTED_BANKS.find(b => b.code === code);
    if (!bank) return false;

    // Remove any non-digit characters
    const cleanNumber = number.replace(/\D/g, '');

    if (bank.type === 'ewallet') {
      // E-wallet: nomor HP Indonesia, 10-13 digit, mulai 08
      if (!/^08\d{8,11}$/.test(cleanNumber)) {
        setBankError('Phone number must be 10-13 digits and start with 08');
        return false;
      }
    } else {
      // Bank: cek panjang sesuai bank
      if (cleanNumber.length !== bank.accountLength) {
        setBankError(`Account number must be ${bank.accountLength} digits for ${bank.name}`);
        return false;
      }
      if (!/^\d+$/.test(cleanNumber)) {
        setBankError('Account number must contain only digits');
        return false;
      }
    }

    setBankError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setBankError(null);

    if (bankCode && !validateBankAccount(bankCode, bankAccountNumber)) {
      setIsSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          whatsapp,
          bio,
          faculty,
          student_id: studentId,
          bank_code: bankCode,
          bank_account_number: bankAccountNumber.replace(/\D/g, ''),
          bank_account_name: bankAccountName
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setBankAccountNumber(value);
    if (bankCode) {
      validateBankAccount(bankCode, value);
    }
  };

  const handleBankCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setBankCode(value);
    const selectedBank = SUPPORTED_BANKS.find(b => b.code === value);
    if (selectedBank) {
      setAccountType(selectedBank.type as BankType);
    }
    if (value && bankAccountNumber) {
      validateBankAccount(value, bankAccountNumber);
    }
  };

  // Helper untuk cek kelengkapan data rekening
  const isBankDataComplete = bankCode && bankAccountNumber && bankAccountName && !bankError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Checklist status data rekening */}
          {isBankDataComplete ? (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span>Data rekening lengkap. Anda siap menerima pembayaran otomatis!</span>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              <span>Data rekening belum lengkap. Silakan lengkapi agar bisa menerima pembayaran.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                WhatsApp Number
              </label>
              <input
                type="tel"
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="+62xxxxxxxxxx"
                required
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Enter your student ID"
              />
            </div>

            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                Faculty
              </label>
              <input
                type="text"
                id="faculty"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Enter your faculty"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Tell us about yourself"
              />
            </div>

            {/* Bank Account Information */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
              <p className="text-sm text-gray-500 mb-4">
                This information is required for receiving payments from sales.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="bankCode"
                    value={bankCode}
                    onChange={handleBankCodeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  >
                    <option value="">Select payment method</option>
                    <optgroup label="Bank Transfer">
                      {SUPPORTED_BANKS.filter(b => b.type === 'bank').map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.icon} {bank.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="E-Wallet">
                      {SUPPORTED_BANKS.filter(b => b.type === 'ewallet').map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.icon} {bank.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">
                      {accountType === 'ewallet' ? 'Phone Number' : 'Account Number'}
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {accountType === 'ewallet' 
                              ? 'Enter your phone number registered with the e-wallet'
                              : 'Enter your bank account number'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      id="bankAccountNumber"
                      value={bankAccountNumber}
                      onChange={handleBankAccountChange}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        bankError ? 'border-red-500' : ''
                      }`}
                      placeholder={accountType === 'ewallet' ? 'Enter your phone number' : 'Enter your account number'}
                      required
                    />
                    {bankCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {accountType === 'ewallet' ? (
                          <Smartphone className="h-4 w-4 text-gray-400" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {bankError && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{bankError}</span>
                    </div>
                  )}
                  {bankCode && !bankError && (
                    <p className="mt-1 text-xs text-gray-500">
                      {accountType === 'ewallet' 
                        ? 'Format: 08xxxxxxxxxx'
                        : `Format: ${'x'.repeat(SUPPORTED_BANKS.find(b => b.code === bankCode)?.accountLength || 0)}`}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="bankAccountName" className="block text-sm font-medium text-gray-700">
                      {accountType === 'ewallet' ? 'Account Name' : 'Account Holder Name'}
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {accountType === 'ewallet'
                              ? 'Enter the name registered with your e-wallet account'
                              : 'Enter the name as it appears on your bank account'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <input
                    type="text"
                    id="bankAccountName"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder={accountType === 'ewallet' ? 'Enter your name' : 'Enter the name on your bank account'}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isBankDataComplete}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function isValidProfile(profile: any): profile is { 
  name: string; 
  whatsapp: string; 
  bio?: string;
  faculty?: string;
  student_id?: string;
  bank_code?: string;
  bank_account_number?: string;
  bank_account_name?: string;
} {
  return profile && 
    typeof profile === 'object' && 
    typeof profile.name === 'string' && 
    typeof profile.whatsapp === 'string';
} 