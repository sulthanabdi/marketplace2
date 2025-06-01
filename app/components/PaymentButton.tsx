'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  productId: string;
  amount: number;
  bill_link_id?: string;
  qr_string?: string;
}

// @ts-ignore
declare global {
  interface Window {
    snap?: any;
  }
}

export default function PaymentButton({ productId, amount, bill_link_id, qr_string }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const snapLoadedRef = useRef(false);

  useEffect(() => {
    if (bill_link_id) {
      const interval = setInterval(async () => {
        const res = await fetch(`/api/payment-status?bill_link_id=${bill_link_id}`);
        const data = await res.json();
        setPaymentStatus(data.status);
        if (data.status === 'success' || data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
        }
      }, 5000);
      setPollingInterval(interval);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [bill_link_id]);

  // Fallback: load Snap.js manual jika belum ada
  const loadSnapScript = () => {
    return new Promise<void>((resolve) => {
      if (window.snap) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      script.async = true;
      script.onload = () => {
        snapLoadedRef.current = true;
        resolve();
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
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
      const { snap_token } = await response.json();
      if (snap_token) {
        if (window.snap) {
          window.snap.pay(snap_token, {
            onSuccess: function(result: any) {
              setPaymentStatus('success');
              alert('Payment successful!');
            },
            onPending: function(result: any) {
              setPaymentStatus('pending');
              alert('Payment pending!');
            },
            onError: function(result: any) {
              setPaymentStatus('failed');
              alert('Payment failed!');
            },
            onClose: function() {
              // User closed the popup
            }
          });
        } else {
          // Fallback: load Snap.js manual, lalu coba lagi
          await loadSnapScript();
          if (window.snap) {
            window.snap.pay(snap_token, {
              onSuccess: function(result: any) {
                setPaymentStatus('success');
                alert('Payment successful!');
              },
              onPending: function(result: any) {
                setPaymentStatus('pending');
                alert('Payment pending!');
              },
              onError: function(result: any) {
                setPaymentStatus('failed');
                alert('Payment failed!');
              },
              onClose: function() {
                // User closed the popup
              }
            });
          } else {
            alert('Midtrans Snap is not loaded.');
          }
        }
      } else {
        throw new Error('Invalid snap token received');
      }
    } catch (error) {
      setPaymentStatus('failed');
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="beforeInteractive"
      />
      {paymentStatus === 'pending' && (
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : `Pay Rp ${amount.toLocaleString('id-ID')}`}
        </button>
      )}
      {paymentStatus === 'success' && (
        <p className="text-green-600">Payment successful!</p>
      )}
      {paymentStatus === 'failed' && (
        <p className="text-red-600">Payment failed. Please try again.</p>
      )}
    </div>
  );
} 