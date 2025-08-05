'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Database } from '@/types/supabase';
import { Edit, MessageSquare, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductActionButtonsProps {
  product: Product;
  currentUser: User | null;
  isOwner: boolean;
}

export default function ProductActionButtons({ product, currentUser, isOwner }: ProductActionButtonsProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const handleMarkAsSold = async () => {
    setIsMarkingSold(true);
    const { error } = await supabase
      .from('products')
      .update({ is_sold: true })
      .eq('id', product.id);

    if (error) {
      console.error('Error marking as sold:', error);
      // Optionally, show an error toast to the user
    } else {
      router.refresh(); // Refresh the page to show the 'Sold' badge
    }
    setIsMarkingSold(false);
  };

  if (isOwner) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button asChild>
          <Link href={`/product/${product.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Product
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleMarkAsSold}
          disabled={isMarkingSold || product.is_sold}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {isMarkingSold ? 'Updating...' : 'Mark as Sold'}
        </Button>
      </div>
    );
  }

  return (
    <Button asChild className="w-full" size="lg">
      <Link href={`/chat/${product.id}/${product.user_id}`}>
        <MessageSquare className="mr-2 h-5 w-5" />
        Chat with Seller
      </Link>
    </Button>
  );
}
