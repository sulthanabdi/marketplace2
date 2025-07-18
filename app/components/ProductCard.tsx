'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Database } from '@/types/supabase';
import { UserCircle, Tag, MapPin, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Product = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string;
    whatsapp: string;
  } | null;
  category?: string;
  condition?: string;
};

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(product.price || 0);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ 
          x: 5,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
          <Link href={`/product/${product.id}`} className="block">
            <CardContent className="p-0">
              <div className="flex">
                {/* Image Section */}
                <div className="relative w-48 h-32 flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={product.image_url || '/placeholder.png'}
                      alt={product.title || 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover rounded-l-lg transition-transform duration-300"
                      priority={false}
                    />
                  </motion.div>
                  {product.is_sold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-l-lg">
                      <Badge className="bg-red-500 text-white border-0">
                        Sold
                      </Badge>
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-700 border-0">
                        <Tag className="h-3 w-3 mr-1" />
                        {product.category}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-red-600 transition-colors duration-200">
                        {product.title || 'Untitled Product'}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {product.description || 'No description available'}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-red-600 mb-1">
                        {formattedPrice}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(product.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <UserCircle className="h-4 w-4" />
                        <span className="font-medium">{product.seller?.name || 'Unknown Seller'}</span>
                      </div>
                      {product.condition && (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          {product.condition}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Grid View (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 }
      }}
    >
      <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group overflow-hidden">
        <Link href={`/product/${product.id}`} className="block">
          <CardContent className="p-0">
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4 }}
                className="relative w-full h-full"
              >
                <Image
                  src={product.image_url || '/placeholder.png'}
                  alt={product.title || 'Product image'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300"
                  priority={false}
                />
              </motion.div>
              
              {/* Overlay for sold items */}
              {product.is_sold && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge className="bg-red-500 text-white border-0 text-lg px-4 py-2">
                    Sold
                  </Badge>
                </div>
              )}
              
              {/* Category badge */}
              {product.category && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-sm">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category}
                  </Badge>
                </div>
              )}
              
              {/* Time ago badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/70 text-white border-0 backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {getTimeAgo(product.created_at)}
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors duration-200">
                  {product.title || 'Untitled Product'}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {product.description || 'No description available'}
                </p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-2xl font-bold text-red-600">
                  {formattedPrice}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 font-medium">4.8</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCircle className="h-4 w-4" />
                  <span className="font-medium truncate max-w-24">
                    {product.seller?.name || 'Unknown Seller'}
                  </span>
                </div>
                {product.condition && (
                  <Badge variant="outline" className="border-gray-200 text-gray-700 text-xs">
                    {product.condition}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
} 