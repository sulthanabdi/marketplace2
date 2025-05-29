'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

type WishlistItem = {
  product_id: string;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wishlist:', error);
        return;
      }

      if (data) {
        const unknownData = data as unknown;
        const typedData = unknownData as WishlistItem[];
        setWishlist(typedData.map(item => item.product_id));
      }
    };

    fetchWishlist();
  }, [supabase]);

  const addToWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
      return;
    }

    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist');
      return;
    }

    setWishlist(prev => [...prev, productId]);
  };

  const removeFromWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .match({ user_id: user.id, product_id: productId });

    if (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove from wishlist');
      return;
    }

    setWishlist(prev => prev.filter(id => id !== productId));
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
} 