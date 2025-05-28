'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import RemoveFromWishlistButton from '@/app/components/RemoveFromWishlistButton';
import { WishlistProvider } from '@/app/context/WishlistContext';

interface Products {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  seller_name: string;
  seller_whatsapp: string;
}

async function getWishlist(supabase: any, userId: string) {
  const { data: products, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      products:products(
        *,
        users:users(name, whatsapp)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }

  return products.map((item: any) => ({
    id: item.products.id,
    title: item.products.title,
    description: item.products.description,
    price: item.products.price,
    image_url: item.products.image_url,
    condition: item.products.condition,
    seller_name: item.products.users.name,
    seller_whatsapp: item.products.users.whatsapp,
  }));
}

function WishlistContent() {
  const [products, setProducts] = useState<Products[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const wishlistProducts = await getWishlist(supabase, user.id);
      setProducts(wishlistProducts);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();

    // Listen for wishlist updates
    const handleWishlistUpdate = (event: CustomEvent) => {
      setProducts(prev => prev.filter(p => p.id !== event.detail.productId));
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate as EventListener);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate as EventListener);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Wishlist</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-600">Start saving products you're interested in!</p>
            <Link
              href="/products"
              className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: Products) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="relative h-48">
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-primary font-medium">
                      Rp {product.price.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Seller: {product.seller_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Condition: {product.condition.replace('_', ' ')}
                    </p>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <RemoveFromWishlistButton productId={product.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <WishlistProvider>
      <WishlistContent />
    </WishlistProvider>
  );
} 