import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Database } from '@/types/supabase';
import ProductCard from '@/app/components/ProductCard';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: products, error } = await supabase
    .from('products')
    .select('*, seller:profiles(name, whatsapp)')
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching products:', error);
    // You might want to return a user-friendly error message here
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Discover Your Next Treasure
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A marketplace for our community. Buy, sell, and connect with trust.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/products">Browse All Products</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/upload">Sell an Item</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">Newest Listings</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No products have been listed yet.</p>
            <p className="text-sm text-muted-foreground">Be the first to sell something!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Telkommerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}