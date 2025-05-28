export const dynamic = "force-dynamic";
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProfileEditForm from './components/ProfileEditForm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  product_count: number;
  wishlist_count: number;
  chat_count: number;
}

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  is_sold: boolean;
  seller_name: string;
}

interface Chat {
  id: number;
  product_id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  product_title: string;
  product_image: string;
  other_user_name: string;
  created_at: string;
}

async function getUserData(supabase: any, userId: string): Promise<UserData | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId);

    const { count: wishlistCount } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: chatCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      whatsapp: profile.whatsapp || '',
      product_count: productCount || 0,
      wishlist_count: wishlistCount || 0,
      chat_count: chatCount || 0,
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

async function getRecentProducts(supabase: any, userId: string): Promise<Product[]> {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      users:users(name)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error getting recent products:', error);
    return [];
  }

  return products.map((product: any) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    image_url: product.image_url,
    is_sold: product.is_sold,
    seller_name: product.users.name,
  }));
}

async function getRecentChats(supabase: any, userId: string): Promise<Chat[]> {
  const { data: chats, error } = await supabase
    .from('messages')
    .select(`
      *,
      products:products(title, image_url),
      sender:users!sender_id(name),
      receiver:users!receiver_id(name)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting recent chats:', error);
    return [];
  }

  // Group chats by product_id and get the latest message for each product
  const latestChatsByProduct = new Map();
  chats.forEach((chat: any) => {
    if (!latestChatsByProduct.has(chat.product_id)) {
      latestChatsByProduct.set(chat.product_id, {
        id: chat.id,
        product_id: chat.product_id,
        sender_id: chat.sender_id,
        receiver_id: chat.receiver_id,
        message: chat.message,
        product_title: chat.products.title,
        product_image: chat.products.image_url,
        other_user_name: chat.sender_id === userId ? chat.receiver.name : chat.sender.name,
        created_at: chat.created_at
      });
    }
  });

  // Convert Map to Array and limit to 4 latest chats
  return Array.from(latestChatsByProduct.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
}

export default async function DashboardPage() {
  try {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  // Check Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your dashboard</h1>
            <Link 
              href="/login" 
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const userId = session.user.id;
    let userData = await getUserData(supabase, userId);

    if (!userData) {
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            name: session.user.user_metadata.name || 'User',
            whatsapp: '', // default whatsapp kosong
          }
        ])
        .select()
        .single();

      if (profileError || !profile) {
        console.error('Error creating user profile:', profileError);
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="max-w-md w-full p-8 text-center">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Error loading dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                {profileError instanceof Error && (
                  <Badge variant="outline" className="text-red-500">
                    {profileError.message}
                  </Badge>
                )}
                <Link
                  href="/"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Go to home page
                </Link>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Type assertion: profile sudah pasti hasil insert user
      const insertedProfile = profile as unknown as { id: string; name: string; whatsapp: string };

      userData = {
        id: insertedProfile.id,
        name: insertedProfile.name,
        email: session.user.email || '', // fallback ke session
        whatsapp: insertedProfile.whatsapp || '',
        product_count: 0,
        wishlist_count: 0,
        chat_count: 0,
      };
    }

    const recentProducts = await getRecentProducts(supabase, userId);
    const recentChats = await getRecentChats(supabase, userId);
  const isSeller = userData.product_count > 0;

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userData.name}!</h1>
            <p className="mt-2 text-lg text-gray-600">Here's what's happening with your account today</p>
        </div>

          {/* Profile Section */}
          <Card className="mb-8 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileEditForm userData={userData} />
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wishlist</p>
                    <h3 className="text-2xl font-bold mt-1">{userData.wishlist_count}</h3>
                  </div>
                  <Link href="/wishlist" className="text-primary hover:text-primary/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
            </Link>
          </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Chats</p>
                    <h3 className="text-2xl font-bold mt-1">{userData.chat_count}</h3>
                  </div>
                  <Link href="/chat" className="text-primary hover:text-primary/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
            </Link>
          </div>
              </CardContent>
            </Card>

            {isSeller ? (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">My Products</p>
                      <h3 className="text-2xl font-bold mt-1">{userData.product_count}</h3>
                    </div>
                    <Link href="/my-products" className="text-primary hover:text-primary/80">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-primary/5 border-primary/20 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Become a Seller</p>
                      <h3 className="text-lg font-semibold mt-1 text-gray-800">Start selling on campus</h3>
                    </div>
                    <Link
                      href="/upload"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Start Now
              </Link>
            </div>
                </CardContent>
              </Card>
          )}
        </div>

          {/* Recent Products Section */}
        {isSeller && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Recent Products</h2>
                <Link 
                  href="/my-products" 
                  className="flex items-center text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </Link>
            </div>
              
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentProducts.map((product) => (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-square">
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.is_sold && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="px-4 py-2 text-lg">
                            Sold
                          </Badge>
                      </div>
                    )}
                  </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                      <p className="mt-1 text-lg font-semibold text-primary">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        )}

          {/* Recent Chats */}
          <Card className="mb-8 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Recent Conversations</CardTitle>
              <Link href="/chat" className="text-sm text-primary hover:text-primary/80">
                View all
            </Link>
            </CardHeader>
            <CardContent>
              {recentChats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.product_id}/${chat.sender_id === userId ? chat.receiver_id : chat.sender_id}`}
                className="block"
              >
                <div className="bg-white rounded-lg border p-5 hover:shadow-md hover:scale-[1.03] transition-all">
                  <div className="flex items-start space-x-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={chat.product_image}
                    alt={chat.product_title}
                    fill
                        className="object-cover rounded-md"
                  />
                </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-400 block mb-1">
                        {new Date(chat.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {chat.other_user_name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mb-1">
                    {chat.product_title}
                  </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                    {chat.message}
                  </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent conversations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">Error loading dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            {error instanceof Error && (
              <Badge variant="outline" className="text-red-500">
                {error.message}
              </Badge>
            )}
            <Link
              href="/"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Go to home page
            </Link>
          </CardContent>
        </Card>
    </div>
  );
  }
} 