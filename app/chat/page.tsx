'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  product_id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  products: {
    title: string;
    image_url: string;
  };
  sender: {
    name: string;
  };
  receiver: {
    name: string;
  };
}

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('Current user:', user.id);

      // Get all messages for the current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          product_id,
          message,
          created_at,
          sender_id,
          receiver_id,
          is_read,
          products!inner (
            title,
            image_url
          ),
          sender:users!messages_sender_id_fkey (
            name
          ),
          receiver:users!messages_receiver_id_fkey (
            name
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Raw messages from Supabase:', messages);

      if (!messages || messages.length === 0) {
        console.log('No messages found');
        setChats([]);
        return;
      }

      // Group messages by product and get the latest message for each chat
      const chatMap = new Map<string, Chat>();
      (messages as unknown as Message[]).forEach((msg) => {
        console.log('Processing message:', msg);

        if (!msg.products || !msg.sender || !msg.receiver) {
          console.warn('Skipping message with missing data:', msg);
          return;
        }

        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUserName = msg.sender_id === user.id ? msg.receiver.name : msg.sender.name;
        const chatKey = `${msg.product_id}-${otherUserId}`;

        console.log('Chat key:', chatKey);
        console.log('Other user:', { id: otherUserId, name: otherUserName });

        if (!chatMap.has(chatKey)) {
          chatMap.set(chatKey, {
            id: chatKey,
            product_id: msg.product_id,
            product_title: msg.products.title,
            product_image: msg.products.image_url,
            other_user_id: otherUserId,
            other_user_name: otherUserName,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
          });
        } else {
          const chat = chatMap.get(chatKey)!;
          if (msg.receiver_id === user.id && !msg.is_read) {
            chat.unread_count++;
          }
        }
      });

      const chatList = Array.from(chatMap.values());
      console.log('Final processed chats:', chatList);
      setChats(chatList);
    } catch (error) {
      console.error('Error in fetchChats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    // Set up polling instead of realtime subscription
    const pollInterval = setInterval(() => {
          fetchChats();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Conversations</h1>

        {chats.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900">No conversations yet</h2>
            <p className="mt-2 text-gray-600">Start chatting with sellers about their products!</p>
            <Link
              href="/products"
              className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              if (!chat || !chat.id || !chat.product_id || !chat.product_title || !chat.product_image || !chat.other_user_id || !chat.other_user_name || !chat.last_message || !chat.last_message_time) {
                console.warn('Skipping chat with incomplete data:', chat);
                return null;
              }
              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.product_id}/${chat.other_user_id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={chat.product_image}
                          alt={chat.product_title}
                          fill
                          sizes="(max-width: 768px) 64px, 64px"
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {chat.product_title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Chat with {chat.other_user_name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-500">
                              {new Date(chat.last_message_time).toLocaleDateString()}
                            </p>
                            {chat.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-gray-600 truncate">{chat.last_message}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 