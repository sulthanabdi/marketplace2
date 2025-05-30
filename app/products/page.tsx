'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import ProductFilter, { FilterState } from '@/app/components/ProductFilter';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type ProductWithSeller = Database['public']['Tables']['products']['Row'] & {
  category?: string;
  seller: {
    name: string;
    whatsapp: string;
  } | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
    }
    fetchProducts();
  };

  const fetchProducts = async (filters?: FilterState) => {
    try {
      setLoading(true);
      setError(null);

    let query = supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        image_url,
        condition,
        category,
        user_id,
        is_sold,
        created_at,
        updated_at,
        status,
        verified_at,
        seller:user_id (
          name,
          whatsapp
        )
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

      if (filters) {
        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`);
    }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.condition) {
          query = query.eq('condition', filters.condition);
    }
        if (filters.minPrice) {
          query = query.gte('price', parseInt(filters.minPrice));
    }
        if (filters.maxPrice) {
          query = query.lte('price', parseInt(filters.maxPrice));
        }
    }

      const { data, error } = await query;

      if (error) throw error;
      setProducts((data || []) as unknown as ProductWithSeller[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    fetchProducts(filters);
  };

  if (loading) {
      return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      );
    }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Upload Product
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <ProductFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </div>
            {products.length > 0 && (
              <Link
                href="/products"
                className="text-sm text-primary hover:text-primary/90"
              >
                Reset filters
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12 bg-white rounded-lg shadow-sm"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Reset filters
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 