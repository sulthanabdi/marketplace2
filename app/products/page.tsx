import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import ProductFilters from '@/app/components/ProductFilters';
import Pagination from '@/app/components/Pagination';
import type { Product } from '@/types/supabase';

interface SearchParams {
  page?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
}

function isValidProduct(product: any): product is Product {
  return (
    product &&
    typeof product === 'object' &&
    typeof product.id === 'string' &&
    typeof product.seller_id === 'string'
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const page = Number(searchParams.page) || 1;
    const itemsPerPage = 12;
    const offset = (page - 1) * itemsPerPage;

    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users (
          name,
          whatsapp
        )
      `, { count: 'exact' })
      .eq('is_sold', false);

    // Apply filters
    if (searchParams.search) {
      query = query.ilike('title', `%${searchParams.search}%`);
    }
    if (searchParams.minPrice) {
      query = query.gte('price', Number(searchParams.minPrice));
    }
    if (searchParams.maxPrice) {
      query = query.lte('price', Number(searchParams.maxPrice));
    }
    if (searchParams.condition) {
      query = query.eq('condition', searchParams.condition);
    }

    // Get total count and paginated results
    const { data: products, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (error) {
      console.error('Error fetching products:', error);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Error loading products</h1>
            <p className="mt-2 text-gray-600">Please try again later</p>
          </div>
        </div>
      );
    }

    // Debug logging
    console.log('Raw products data:', products);
    console.log('User session:', await supabase.auth.getSession());
    const validProducts = Array.isArray(products) ? (products as any[]).filter(isValidProduct) : [];
    validProducts.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        id: product.id,
        seller_id: product.seller_id,
        seller: product.seller,
        seller_name: product.seller?.name,
      });
    });

    const totalPages = count ? Math.ceil(count / itemsPerPage) : 0;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64">
              <ProductFilters />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {validProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/products"
                    searchParams={searchParams as Record<string, string | undefined>}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ProductsPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }
} 