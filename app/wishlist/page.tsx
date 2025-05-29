'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useWishlist } from '@/app/context/WishlistContext';
import { WishlistProvider } from '@/app/context/WishlistContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  seller_name: string;
  seller_whatsapp: string;
}

type WishlistItem = {
  products: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    condition: string;
    users: {
      name: string;
      whatsapp: string;
    };
  };
};

function WishlistContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const { wishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

        const { data: wishlistItems, error } = await supabase
          .from('wishlists')
          .select(`
            products:product_id (
              id,
              title,
              description,
              price,
              image_url,
              condition,
              users:user_id (
                name,
                whatsapp
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching wishlist:', error);
          return;
        }

        if (wishlistItems) {
          // First cast to unknown to avoid type checking
          const unknownItems = wishlistItems as unknown;
          // Then cast to our expected type
          const typedItems = unknownItems as WishlistItem[];
          
          const formattedProducts = typedItems
            .map(item => item.products)
            .filter(Boolean)
            .map(product => ({
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              image_url: product.image_url,
              condition: product.condition,
              seller_name: product.users.name,
              seller_whatsapp: product.users.whatsapp,
            }));

          setProducts(formattedProducts);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

    fetchWishlistProducts();
  }, [supabase, wishlist]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
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
            {products.map((product) => (
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
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="w-full text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove from wishlist
                  </button>
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