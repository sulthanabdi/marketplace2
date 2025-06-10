'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProductActions from '@/app/components/ProductActions';
import ProductDetail from './ProductDetail';
import PaymentButton from '@/app/components/PaymentButton';
import { useWishlist } from '@/app/context/WishlistContext';
import { WishlistProvider } from '@/app/context/WishlistContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProductWithSeller = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  user_id: string;
  is_sold: boolean;
  created_at: string;
  seller: {
    name: string;
    whatsapp: string;
  };
};

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  user_id: string;
  is_sold: boolean;
  created_at: string;
  seller_name: string;
  seller_whatsapp: string;
}

function ChatBox({ productId, sellerId, userId }: { productId: string; sellerId: string; userId: string | undefined }) {
  if (!userId) {
    return (
      <Link
        href="/login"
        className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 text-center block"
      >
        Login to Chat
      </Link>
    );
  }
  if (userId === sellerId) {
    return null;
  }
  return (
    <Link
      href={`/chat/${productId}/${sellerId}`}
      className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 text-center block"
    >
      Chat with Seller
    </Link>
  );
}

function ProductContent({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient<Database>();
  const { isInWishlist } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          setCurrentUserId(user.id);
        }

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            id,
            title,
            description,
            price,
            image_url,
            condition,
            user_id,
            is_sold,
            created_at,
            seller:users (
              name,
              whatsapp
            )
          `)
          .eq('id', productId)
          .single();

        if (productError) {
          console.error('Error fetching product:', productError);
          return;
        }

        if (productData) {
          const unknownData = productData as unknown;
          const typedProduct = unknownData as ProductWithSeller;
          const formattedProduct: Product = {
            id: typedProduct.id,
            title: typedProduct.title,
            description: typedProduct.description,
            price: typedProduct.price,
            image_url: typedProduct.image_url,
            condition: typedProduct.condition,
            user_id: typedProduct.user_id,
            is_sold: typedProduct.is_sold,
            created_at: typedProduct.created_at,
            seller_name: typedProduct.seller.name,
            seller_whatsapp: typedProduct.seller.whatsapp.startsWith('+62')
              ? typedProduct.seller.whatsapp
              : typedProduct.seller.whatsapp.startsWith('0')
                ? '+62' + typedProduct.seller.whatsapp.slice(1)
                : '+62' + typedProduct.seller.whatsapp
          };
          setProduct(formattedProduct);
          setIsOwner(user?.id === typedProduct.user_id);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Link href="/products" className="mt-4 text-primary hover:text-primary/90">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative h-80 w-full">
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <p className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Rp {new Intl.NumberFormat('id-ID').format(product.price)}
              </p>
              <p className="mb-4 text-gray-700">{product.description}</p>
              <div className="mb-2">
                <span className="font-medium text-gray-900">Condition: </span>
                <span className="capitalize">{product.condition.replace('_', ' ')}</span>
              </div>
              <div className="mb-6">
                <span className="font-medium text-gray-900">Seller: </span>
                <span>{product.seller_name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              {isOwner ? (
                <>
                  <button
                    className="w-full bg-[color:var(--color-primary)] text-white py-3 rounded-md font-semibold hover:bg-red-700 transition"
                    onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}
                  >
                    Edit Product
                  </button>
                  <button
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('products')
                        .update({ is_sold: true })
                        .eq('id', product.id);
                      if (!error) {
                        window.location.reload();
                      }
                    }}
                  >
                    Mark as Sold
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={`https://wa.me/${product.seller_whatsapp.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[color:var(--color-success)] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.58A12.13 12.13 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.38-.22-3.69.94.99-3.59-.25-.37A9.93 9.93 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.47-7.14c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.48 1.08 2.92 1.23 3.12.15.2 2.13 3.25 5.17 4.43.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.41-.08-.11-.28-.18-.58-.33z"/></svg>
                    WhatsApp
                  </a>
                  <button
                    className="w-full bg-red-100 text-[color:var(--color-error)] py-3 rounded-md font-semibold hover:bg-red-200 transition"
                  >
                    Remove from Wishlist
                  </button>
                  <PaymentButton 
                    productId={product.id}
                    amount={product.price}
                  />
                  <ChatBox 
                    productId={product.id}
                    sellerId={product.user_id}
                    userId={currentUserId}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <WishlistProvider>
      <ProductContent productId={params.id} />
    </WishlistProvider>
  );
} 