'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Database } from '@/types/supabase';
import { UserCircleIcon, TagIcon } from '@heroicons/react/24/outline';

type Product = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string;
    whatsapp: string;
  } | null;
  category?: string;
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  console.log('ProductCard received product:', product);

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(product.price || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            <Image
              src={product.image_url || '/placeholder.png'}
              alt={product.title || 'Product image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={false}
            />
          </motion.div>
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium text-lg bg-red-500 px-4 py-2 rounded-full">
                Sold
              </span>
            </div>
          )}
          {product.category && (
            <div className="absolute top-2 left-2">
              <div className="inline-flex items-center px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                <TagIcon className="h-3 w-3 mr-1" />
                {product.category}
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.title || 'Untitled Product'}
          </h3>
          <p className="text-xl font-bold text-primary mb-3">
            {formattedPrice}
          </p>
          <div className="flex items-center text-sm text-gray-600 border-t pt-3">
            <UserCircleIcon className="h-5 w-5 mr-1 text-gray-400" />
            <span className="truncate">{product.seller?.name || 'Unknown Seller'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 