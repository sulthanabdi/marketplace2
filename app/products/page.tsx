import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
    const search = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';
    const condition = typeof searchParams.condition === 'string' ? searchParams.condition.trim() : '';
    const minPrice = typeof searchParams.minPrice === 'string' && searchParams.minPrice !== '' ? Number(searchParams.minPrice) : undefined;
    const maxPrice = typeof searchParams.maxPrice === 'string' && searchParams.maxPrice !== '' ? Number(searchParams.maxPrice) : undefined;
    const category = typeof searchParams.category === 'string' ? searchParams.category.trim() : '';

  try {
    // Build query
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
        seller:users (
          name,
          whatsapp
        )
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (condition && (condition === 'new' || condition === 'used')) {
      query = query.eq('condition', condition);
    }
    if (minPrice !== undefined && !isNaN(minPrice)) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      query = query.lte('price', maxPrice);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

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

    // UI: Search & Filter
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <form className="mb-6 flex flex-wrap gap-4 items-end" method="GET">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            defaultValue={search}
            className="border rounded px-3 py-2 w-48"
          />
          <select name="category" defaultValue={category} className="border rounded px-3 py-2">
            <option value="">All Categories</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Fashion">Fashion</option>
            <option value="Buku">Buku</option>
            <option value="Aksesoris">Aksesoris</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <select name="condition" defaultValue={condition} className="border rounded px-3 py-2">
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            defaultValue={minPrice ?? ''}
            className="border rounded px-3 py-2 w-28"
            min={0}
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            defaultValue={maxPrice ?? ''}
            className="border rounded px-3 py-2 w-28"
            min={0}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Search
          </button>
          <Link href="/products" className="ml-2 text-blue-600 underline text-sm">Reset</Link>
        </form>
        <div className="mb-4 text-sm text-gray-600">
          {typedProducts.length} product(s) found
            </div>
        {typedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {typedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No products found.</p>
            <p className="text-gray-400 text-sm">Coba kurangi filter atau klik <Link href="/products" className="text-blue-600 underline">Reset</Link></p>
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