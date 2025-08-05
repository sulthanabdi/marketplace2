import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import ProductFilters from '@/app/components/ProductFilters';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type ProductsPageProps = {
  searchParams: {
    search?: string;
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
  };
};

async function fetchProducts(searchParams: ProductsPageProps['searchParams']) {
  const supabase = createServerComponentClient<Database>({ cookies });

  let query = supabase
    .from('products')
    .select('*, seller:profiles(name, whatsapp)')
    .eq('is_sold', false)
    .order('created_at', { ascending: false });

  if (searchParams.search) {
    query = query.ilike('title', `%${searchParams.search}%`);
  }
  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }
  if (searchParams.condition) {
    query = query.eq('condition', searchParams.condition);
  }
  if (searchParams.minPrice) {
    query = query.gte('price', parseInt(searchParams.minPrice));
  }
  if (searchParams.maxPrice) {
    query = query.lte('price', parseInt(searchParams.maxPrice));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Could not fetch products. Please try again later.');
  }

  return data;
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-6 w-1/2 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
        </div>
      ))}
    </div>
  );
}

async function ProductList({ searchParams }: ProductsPageProps) {
  try {
    const products = await fetchProducts(searchParams);

    if (!products || products.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg mt-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No products found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  } catch (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Explore Products</h1>
            <p className="text-muted-foreground">
              Find what you need from our community marketplace.
            </p>
          </div>
          <Button asChild>
            <Link href="/upload">
              <Plus className="mr-2 h-4 w-4" /> Sell Your Item
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <ProductFilters />

        {/* Products Grid */}
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}