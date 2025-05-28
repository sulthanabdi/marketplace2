'use client';

import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function SellItemButton() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const handleClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
    } else {
      router.push('/upload');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg hover:bg-primary/10 transition duration-300"
    >
      Sell an Item
    </button>
  );
} 