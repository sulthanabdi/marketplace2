'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WishlistContextType {
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const removeFromWishlist = (productId: string) => {
    // Trigger re-render of wishlist items
    const event = new CustomEvent('wishlist-updated', { detail: { productId } });
    window.dispatchEvent(event);
  };

  return (
    <WishlistContext.Provider value={{ removeFromWishlist }}>
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