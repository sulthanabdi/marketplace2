'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useWishlist } from '@/app/context/WishlistContext';

export default function RemoveFromWishlistButton({ productId }: { productId: string }) {
  const supabase = createClientComponentClient<Database>();
  const { removeFromWishlist } = useWishlist();

  const handleRemove = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please login first');
        return;
      }

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .match({ 
          user_id: user.id, 
          product_id: productId 
        });

      if (error) {
        console.error('Error removing from wishlist:', error);
        alert('Failed to remove from wishlist');
        return;
      }

      // Notify that wishlist has been updated
      removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove from wishlist');
    }
  };

  return (
    <button
      onClick={handleRemove}
      className="w-full text-red-600 hover:text-red-700 text-sm font-medium"
    >
      Remove from wishlist
    </button>
  );
} 