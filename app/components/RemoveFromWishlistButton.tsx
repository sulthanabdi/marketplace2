'use client';

import { useWishlist } from '@/app/context/WishlistContext';

export default function RemoveFromWishlistButton({ productId }: { productId: string }) {
  const { removeFromWishlist } = useWishlist();

  return (
    <button
      onClick={() => removeFromWishlist(productId)}
      className="w-full text-red-600 hover:text-red-700 text-sm font-medium"
    >
      Remove from wishlist
    </button>
  );
} 