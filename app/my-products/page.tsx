export const dynamic = "force-dynamic";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Database } from '@/types/supabase';
import ProductCard from '../components/ProductCard';
import type { Product } from '@/types/supabase';

async function getMyProducts(userId: string): Promise<Product[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      users!products_seller_id_fkey (
        name,
        whatsapp
      )
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Debug logging
  // console.log('My products data:', products);
  function isValidProduct(product: any): product is Product {
    return (
      product &&
      typeof product === 'object' &&
      typeof product.id === 'string' &&
      typeof product.seller_id === 'string' &&
      Array.isArray(product.users)
    );
  }
  const validProducts = Array.isArray(products) ? (products as any[]).filter(isValidProduct) : [];
  return validProducts;
}

export default async function MyProductsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in to view your products</h1>
          <Link href="/login" className="mt-4 text-primary hover:text-primary/90">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const validProducts = await getMyProducts(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <Link
            href="/upload"
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Upload New Product
          </Link>
        </div>

        {validProducts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900">No products yet</h2>
            <p className="mt-2 text-gray-600">Start selling by uploading your first product!</p>
            <Link
              href="/upload"
              className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Upload Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {validProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 