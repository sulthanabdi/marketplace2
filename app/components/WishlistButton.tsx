'use client';

import { useWishlist } from '@/app/context/WishlistContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Props = {
  productId: string;
  isWishlisted: boolean;
};

export default function WishlistButton({ productId, isWishlisted: initialIsWishlisted }: Props) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (isWishlisted) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      className={`w-full px-6 py-3 rounded-md text-center font-medium transition-colors ${
        isWishlisted 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  );
}