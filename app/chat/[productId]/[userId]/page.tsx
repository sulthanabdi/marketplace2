'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ChatRoom from '@/app/components/ChatRoom';
import { useRouter } from 'next/navigation';

interface ChatPageProps {
  params: {
    productId: string;
    userId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const [chatData, setChatData] = useState<{
    productTitle: string;
    productImage: string;
    otherUserName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch product and user data
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('title, image_url')
          .eq('id', params.productId)
          .single();

        if (productError || !product || typeof product !== 'object' || !('title' in product)) throw productError || new Error('Product not found');

        const { data: otherUser, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', params.userId)
          .single();

        if (userError || !otherUser || typeof otherUser !== 'object' || !('name' in otherUser)) throw userError || new Error('User not found');

        const prod = product as { title: string; image_url: string };
        const other = otherUser as { name: string };

        setChatData({
          productTitle: prod.title,
          productImage: prod.image_url,
          otherUserName: other.name,
        });
      } catch (error) {
        console.error('Error fetching chat data:', error);
        router.push('/chat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [params.productId, params.userId, router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Chat not found</h1>
          <p className="mt-2 text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow h-[calc(100vh-8rem)]">
          <ChatRoom
            productId={params.productId}
            otherUserId={params.userId}
            otherUserName={chatData.otherUserName}
            productTitle={chatData.productTitle}
            productImage={chatData.productImage}
          />
        </div>
      </div>
    </div>
  );
} 