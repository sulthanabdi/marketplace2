import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import { redirect } from 'next/navigation';

type ProductWithSeller = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string;
    whatsapp: string;
  } | null;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    const supabase = createServerComponentClient<Database>({ cookies });

  // Check session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session);
  
  if (!session) {
    redirect('/login');
  }

  // Get query parameters
    const page = Number(searchParams.page) || 1;
    const itemsPerPage = 12;
    const offset = (page - 1) * itemsPerPage;

  try {
    // Build query
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        image_url,
        condition,
        user_id,
        is_sold,
        created_at,
        seller:users (
          name,
          whatsapp
        )
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Products</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading products: {error.message}
          </div>
        </div>
      );
    }

    console.log('Raw products data:', products);
    
    const typedProducts = (products || []) as unknown as ProductWithSeller[];

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        {typedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {typedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Unexpected error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }
} 