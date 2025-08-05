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

  // For the sake of consistency and a cleaner look, we'll focus on the grid view first.
  // The list view can be refactored similarly if needed.

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full flex flex-col overflow-hidden group border-border hover:border-primary transition-all duration-300">
        <Link href={`/product/${product.id}`} className="block h-full">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={product.image_url || '/placeholder.png'}
                alt={product.title || 'Product image'}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={false}
              />
              
              {product.is_sold && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge className="bg-destructive text-destructive-foreground border-0 text-sm px-3 py-1">
                    Sold
                  </Badge>
                </div>
              )}

              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-muted-foreground text-xs">
                  <Clock className="h-3 w-3 mr-1.5" />
                  {getTimeAgo(product.created_at)}
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
              {product.category && (
                  <Badge variant="outline" className="w-fit mb-2 text-xs">
                    {product.category}
                  </Badge>
              )}

              <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 flex-grow">
                {product.title || 'Untitled Product'}
              </h3>

              <div className="mt-auto">
                <p className="text-lg font-bold text-primary mb-3">
                  {formattedPrice}
                </p>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                    <span className="font-medium truncate max-w-32">
                      {product.seller?.name || 'Anonymous'}
                    </span>
                  </div>
                  {product.condition && (
                    <Badge variant="secondary" className="text-xs">
                      {product.condition}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
} 