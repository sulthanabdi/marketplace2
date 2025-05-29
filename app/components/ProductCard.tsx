'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Database } from '@/types/supabase';
import { UserCircleIcon } from '@heroicons/react/24/outline';

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
      className="bg-white rounded-lg shadow-sm overflow-hidden group"
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
              className="object-cover transition-transform duration-300"
              priority={false}
            />
          </motion.div>
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium text-lg">Sold</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.title || 'Untitled Product'}
          </h3>
          {product.category && (
            <div className="inline-block mb-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {product.category}
            </div>
          )}
          <p className="text-xl font-bold text-blue-600 mb-2">
            {formattedPrice}
          </p>
          <div className="flex items-center text-sm text-gray-600">
            <UserCircleIcon className="h-5 w-5 mr-1" />
            <span>{product.seller?.name || 'Unknown Seller'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 