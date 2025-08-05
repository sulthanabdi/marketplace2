import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, MessageSquare, Tag, User, DollarSign, AlertTriangle, Edit } from 'lucide-react';
import ProductActionButtons from './ProductActionButtons';

type ProductPageProps = {
  params: {
    id: string;
  };
};

async function getProduct(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: product, error } = await supabase
    .from('products')
    .select('*, seller:profiles(id, name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    // Return null or throw an error to be caught by a higher-level boundary
    return null;
  }

  return product;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound(); // This will render the not-found.tsx file
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price || 0);

  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === product.user_id;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Image Section (Left) */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative h-80 md:h-[500px] w-full">
              <Image
                src={product.image_url || '/placeholder.png'}
                alt={product.title || 'Product image'}
                fill
                className="object-cover"
                priority
              />
              {product.is_sold && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Badge className="text-lg px-6 py-2 bg-destructive/80">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Sold
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Details Section (Right) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {product.condition && (
                <Badge variant="secondary">{product.condition}</Badge>
              )}
              {product.category && (
                <Badge variant="outline">{product.category}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {product.title}
            </h1>
            <p className="text-3xl font-bold text-primary">{formattedPrice}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Description</h3>
            <p className="text-muted-foreground">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Seller Info */}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{product.seller?.name || 'Anonymous Seller'}</p>
                <p className="text-sm text-muted-foreground">Seller</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            <ProductActionButtons product={product} currentUser={user} isOwner={isOwner} />
          </div>
        </div>
      </div>
    </div>
  );
}