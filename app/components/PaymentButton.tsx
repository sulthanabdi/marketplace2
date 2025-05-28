'use client';

import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if snap is loaded
    if (window.snap) {
      setSnapReady(true);
    }
  }, []);

  const handlePayment = async () => {
    if (!snapReady) {
      alert('Payment system is not ready. Please try again in a moment.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payment');
      }

      const { token, redirect_url } = await response.json();
      
      // @ts-ignore
      window.snap.pay(token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          router.push('/transactions');
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          router.push('/transactions');
        },
        onError: function(result: any) {
          console.error('Payment error:', result);
          alert('Payment failed. Please try again.');
        },
        onClose: function() {
          console.log('Payment popup closed');
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
        onLoad={() => setSnapReady(true)}
      />
      <button
        onClick={handlePayment}
        disabled={isLoading || !snapReady}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : `Pay Rp ${amount.toLocaleString('id-ID')}`}
      </button>
    </>
  );
} 