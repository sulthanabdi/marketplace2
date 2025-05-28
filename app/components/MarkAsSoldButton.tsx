'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface MarkAsSoldButtonProps {
  productId: string;
}

export default function MarkAsSoldButton({ productId }: MarkAsSoldButtonProps) {
  const supabase = createClientComponentClient<Database>();

  const handleMarkAsSold = async () => {
    const { error } = await supabase
      .from('products')
      .update({ is_sold: true })
      .eq('id', productId);
    
    if (!error) {
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleMarkAsSold}
      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-md text-center font-medium hover:bg-red-700"
    >
      Mark as Sold
    </button>
  );
} 