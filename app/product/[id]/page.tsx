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
import { motion } from 'framer-motion';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ArrowLeft, Heart, Share2, Clock, User, Tag, MapPin, Star, Edit3, CheckCircle, MessageCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
      <Link href="/login">
        <Button className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
          <MessageCircle className="h-4 w-4" />
          Login to Chat
        </Button>
      </Link>
    );
  }
  if (userId === sellerId) {
    return null;
  }
  return (
    <Link href={`/chat/${productId}/${sellerId}`}>
      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
        <MessageCircle className="h-4 w-4" />
        Chat with Seller
      </Button>
    </Link>
  );
}

function ProductContent({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-32 rounded" />
            </div>
            
            {/* Product Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mb-6">
              <ShoppingCart className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link href="/products">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2 mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </div>

          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Image Section */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="relative h-80 lg:h-[450px] w-full rounded-xl overflow-hidden mb-4">
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                    priority
                    onClick={() => setLightboxOpen(true)}
                  />
                  {product.is_sold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge className="bg-red-500 text-white border-0 text-lg px-6 py-3">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Sold
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[product.image_url, product.image_url, product.image_url, product.image_url, product.image_url].map((img, index) => (
                    <div key={index} className="relative h-20 w-full rounded-md overflow-hidden cursor-pointer">
                      <Image
                        src={img}
                        alt={`${product.title} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Info Section */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeAgo(product.created_at)}
                  </Badge>
                  <Badge variant="outline" className="border-gray-200 text-gray-700">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.condition.replace('_', ' ')}
                  </Badge>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.title}
                </h1>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </div>
                  <span className="text-sm text-gray-600">(4.8 • 24 reviews)</span>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 mb-6">
                  <p className="text-4xl font-bold text-red-600 mb-2">
                    Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                  </p>
                  <p className="text-sm text-gray-600">Free shipping • 30-day return</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Seller Info */}
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{product.seller_name}</h4>
                      <p className="text-sm text-gray-600">Verified Seller</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isOwner ? (
                  <>
                    <Button
                      onClick={() => router.push(`/product/${product.id}/edit`)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Product
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const { error } = await supabase
                          .from('products')
                          .update({ is_sold: true })
                          .eq('id', product.id);
                        if (!error) {
                          window.location.reload();
                        }
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Sold
                    </Button>
                  </>
                ) : (
                  <>
                    <a
                      href={`https://wa.me/${product.seller_whatsapp.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.58A12.13 12.13 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.38-.22-3.69.94.99-3.59-.25-.37A9.93 9.93 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.47-7.14c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.48 1.08 2.92 1.23 3.12.15.2 2.13 3.25 5.17 4.43.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.41-.08-.11-.28-.18-.58-.33z"/>
                      </svg>
                      WhatsApp
                    </a>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      Remove from Wishlist
                    </Button>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={[{ src: product.image_url }]}
      />
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