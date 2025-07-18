'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import ProductFilter, { FilterState } from '@/app/components/ProductFilter';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Package, RefreshCw, Grid3X3, List, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUploadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/upload');
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <Skeleton className="h-6 w-80 rounded-lg" />
              </div>
              <Skeleton className="h-12 w-44 rounded-xl" />
            </div>
            
            {/* Filter Skeleton */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-32 rounded" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary Skeleton */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-6 w-1/3 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mb-6">
                  <svg className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isRefreshing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isRefreshing ? 'Refreshing...' : 'Try Again'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 to-rose-700 bg-clip-text text-transparent">
                  Discover Products
                </h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Explore amazing items from our trusted community of sellers. Find exactly what you're looking for with our powerful search and filter tools.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUploadClick}
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <Plus className="h-5 w-5" />
                Upload Product
              </Button>
            </div>
          </div>
          
          {/* Filter Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <ProductFilter onFilterChange={handleFilterChange} />
            </CardContent>
          </Card>

          {/* Results Summary & Controls */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl shadow-sm">
                  <Package className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {products.length} product{products.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-sm text-gray-500">Browse through our curated collection</p>
                </div>
              </div>
              {products.length > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                  Latest First
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-red-100 text-red-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-red-100 text-red-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              {/* Refresh Button */}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Products Display */}
          <AnimatePresence mode="wait">
            {products.length > 0 ? (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={viewMode === 'list' ? 'w-full' : ''}
                  >
                    <ProductCard product={product} viewMode={viewMode} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-16">
                    <div className="text-center">
                      <div className="w-28 h-28 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                        <Search className="h-14 w-14 text-red-500" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">No products found</h3>
                      <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg">
                        We couldn't find any products matching your criteria. Try adjusting your search filters or explore our categories.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/products">
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="shadow-sm hover:shadow-md transition-all duration-200 border-red-200 text-red-600 hover:bg-red-50 px-8 py-3"
                          >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Reset Filters
                          </Button>
                        </Link>
                        <Button
                          onClick={handleUploadClick}
                          size="lg"
                          className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-8 py-3"
                        >
                          <Plus className="h-5 w-5" />
                          Upload Product
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Load More Section */}
          {products.length > 0 && products.length >= 12 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mt-16"
            >
              <Button 
                variant="outline" 
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-200 border-red-200 text-red-600 hover:bg-red-50 px-10 py-4 text-lg font-semibold"
              >
                Load More Products
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 