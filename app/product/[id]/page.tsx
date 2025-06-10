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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="relative h-96">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-lg"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
              <p className="mt-2 text-2xl font-medium text-primary">
                Rp {new Intl.NumberFormat('id-ID').format(product.price)}
              </p>
              <p className="mt-4 text-gray-600">{product.description}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Condition</h2>
                  <p className="mt-1 text-gray-600 capitalize">
                    {product.condition.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Seller</h2>
                  <p className="mt-1 text-gray-600">{product.seller_name}</p>
                </div>
                <ProductActions
                  productId={product.id}
                  sellerId={product.user_id}
                  sellerWhatsapp={product.seller_whatsapp}
                  title={product.title}
                  isOwner={isOwner}
                  isWishlisted={isInWishlist(product.id)}
                  isSold={product.is_sold}
                  userId={product.user_id}
                />
                <ProductDetail 
                  productId={product.id}
                  sellerId={product.user_id}
                  userId={product.user_id}
                />
                {!isOwner && !product.is_sold && isAuthenticated && (
                  <div className="mt-6">
                    <PaymentButton 
                      productId={product.id}
                      amount={product.price}
                    />
                    <ChatBox 
                      productId={product.id}
                      sellerId={product.user_id}
                      userId={currentUserId}
                    />
                  </div>
                )}
                {!isOwner && !product.is_sold && !isAuthenticated && (
                  <div className="mt-6">
                    <Link
                      href="/login"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-center block"
                    >
                      Login to Purchase
                    </Link>
                  </div>
                )}
              </div>
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