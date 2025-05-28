export const dynamic = "force-dynamic";

import Image from 'next/image';
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import ProductActions from '@/app/components/ProductActions';
import ProductDetail from './ProductDetail';
import PaymentButton from '@/app/components/PaymentButton';

async function getProduct(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // First get the product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (productError) {
    console.error('Error fetching product:', productError);
    return null;
  }

  // Then get the seller info
  function isValidProduct(product: any): product is { seller_id: string } {
    return product && typeof product === 'object' && typeof product.seller_id === 'string';
  }

  let sellerData = null;
  if (isValidProduct(product)) {
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('name, whatsapp')
      .eq('id', product.seller_id)
      .single();
    sellerData = seller;
    if (sellerError) {
      console.error('Error fetching seller:', sellerError);
    }
  }

  function isValidSeller(seller: any): seller is { name: string; whatsapp: string } {
    return seller && typeof seller === 'object' && typeof seller.name === 'string' && typeof seller.whatsapp === 'string';
  }

  if (!isValidProduct(product) || !isValidSeller(sellerData)) {
    return {
      id: '',
      title: '',
      description: '',
      price: 0,
      image_url: '',
      condition: '',
      seller_id: '',
      is_sold: false,
      created_at: '',
      seller_name: 'Unknown',
      seller_whatsapp: '',
    };
  }

  // product is guaranteed to be a valid object here
  const safeProduct = product as { [key: string]: any };

  return {
    ...safeProduct,
    seller_name: sellerData.name,
    seller_whatsapp: sellerData.whatsapp.startsWith('+62')
      ? sellerData.whatsapp
      : sellerData.whatsapp.startsWith('0')
        ? '+62' + sellerData.whatsapp.slice(1)
        : '+62' + sellerData.whatsapp
  };
}

async function isInWishlist(userId: string, productId: string) {
  if (!userId) return false;
  
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .match({ user_id: userId, product_id: productId })
    .single();

  if (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }

  return !!data;
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  const product = await getProduct(params.id);
  const isWishlisted = userId ? await isInWishlist(userId, params.id) : false;

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

  const isOwner = userId === product.seller_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="relative h-96">
              <Image
                src={product.image_url || ''}
                alt={product.title || ''}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-lg"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.title || ''}</h1>
              <p className="mt-2 text-2xl font-medium text-primary">
                Rp {new Intl.NumberFormat('id-ID').format(product.price || 0)}
              </p>
              <p className="mt-4 text-gray-600">{product.description || ''}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Condition</h2>
                  <p className="mt-1 text-gray-600 capitalize">
                    {(product.condition || '').replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Seller</h2>
                  <p className="mt-1 text-gray-600">{product.seller_name || ''}</p>
                </div>
                <ProductActions
                  productId={product.id || ''}
                  sellerId={product.seller_id || ''}
                  sellerWhatsapp={product.seller_whatsapp || ''}
                  title={product.title || ''}
                  isOwner={isOwner}
                  isWishlisted={isWishlisted}
                  isSold={product.is_sold || false}
                  userId={userId || ''}
                />
                <ProductDetail 
                  productId={product.id || ''}
                  sellerId={product.seller_id || ''}
                  userId={userId || ''}
                />
                {!isOwner && !(product.is_sold || false) && (
                  <div className="mt-6">
                    <PaymentButton 
                      productId={product.id || ''}
                      amount={product.price || 0}
                    />
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