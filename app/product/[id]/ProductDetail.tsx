'use client';

import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface ProductDetailProps {
  productId: string;
  sellerId: string;
  userId: string | undefined;
}

export default function ProductDetail({ productId, sellerId, userId }: ProductDetailProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const handleChat = async () => {
    try {
      if (!userId) {
        router.push('/login');
        return;
      }

      if (userId === sellerId) {
        alert('You cannot chat with yourself');
        return;
      }

      router.push(`/chat/${productId}/${sellerId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Don't show chat button if user is the seller
  if (userId === sellerId) {
    return null;
  }

  return (
    <button
      onClick={handleChat}
      className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90"
    >
      Chat with Seller
    </button>
  );
} 