'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

type Props = {
  productId: string;
  isWishlisted: boolean;
};

export default function WishlistButton({ productId, isWishlisted: initialIsWishlisted }: Props) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();

  const toggleWishlist = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Silakan login terlebih dahulu');
      setIsLoading(false);
      return;
    }

    if (isWishlisted) {
      // Hapus dari wishlist
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .match({ user_id: user.id, product_id: productId });
      if (!error) setIsWishlisted(false);
    } else {
      // Tambah ke wishlist
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId });
      if (!error) setIsWishlisted(true);
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={isLoading}
      className="w-full px-6 py-3 rounded-md text-center font-medium transition-colors"
    >
      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  );
}