'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string;
    whatsapp: string;
  } | null;
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };

  // Debug logging
  console.log('ProductCard data:', {
    id: product.id,
    seller_id: product.seller_id,
    seller: product.seller,
    seller_name: product.seller?.name
  });

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
      <Link href={`/product/${product.id}`}>
        <div className="relative h-48 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={product.image_url}
              alt={product.title}
              width={400}
              height={300}
              className="object-cover w-full h-full transition-transform duration-300"
              priority
            />
          </motion.div>
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium text-lg">Sold</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 truncate group-hover:text-primary transition-colors duration-200">
            {product.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 truncate">
            {product.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-lg font-medium text-primary">
              Rp {formatPrice(product.price)}
            </p>
            <p className="text-sm text-gray-500 capitalize">
              {product.condition.replace('_', ' ')}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
            Seller: {product.seller?.name || 'Unknown'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
} 