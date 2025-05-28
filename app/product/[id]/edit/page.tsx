'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProductForm from '@/app/components/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient<Database>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      let id = params.id;
      if (Array.isArray(id)) id = id[0];
      if (typeof id !== 'string') return;
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !product) {
        setProduct(null);
      } else {
        setProduct(product);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [params.id, router, supabase]);

  async function updateProduct(formData: any) {
    let id = params.id;
    if (Array.isArray(id)) id = id[0];
    if (typeof id !== 'string') return;
    const { error } = await supabase
      .from('products')
      .update({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        condition: formData.condition,
        image_url: formData.image_url,
      })
      .eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="mt-2 text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Product</h1>
          <ProductForm
            initialData={typeof product === 'object' && product.title ? product : undefined}
            onSubmit={updateProduct}
          />
        </div>
      </div>
    </div>
  );
} 