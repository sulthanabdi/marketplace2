'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

// Declare global type for snap
declare global {
  interface Window {
    snap: {
      pay: (token: string, callbacks: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

interface PaymentButtonProps {
  productId: string;
  amount: number;
}

export default function PaymentButton({ productId, amount }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      window.snap.pay(data.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          router.push(`/transactions/${result.order_id}`);
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          router.push(`/transactions/${result.order_id}`);
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          alert('Payment failed. Please try again.');
        },
        onClose: function() {
          console.log('Payment popup closed');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="beforeInteractive"
      />
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay Rp ${amount.toLocaleString('id-ID')}`}
      </button>
    </>
  );
} 