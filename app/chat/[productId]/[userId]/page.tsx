'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender: {
    name: string;
  };
}

interface Product {
  title: string;
  image_url: string;
}

interface User {
  name: string;
}

interface SupabaseMessage {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender: {
    name: string;
  };
}

type ProductResponse = {
  title: string;
  image_url: string;
} | null;

type UserResponse = {
  name: string;
} | null;

type MessageResponse = {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender: {
    name: string;
  };
}[] | null;

export default function ChatPage({ params }: { params: { productId: string; userId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('title, image_url')
          .eq('id', params.productId)
          .single();

        if (productError || !productData) {
          setError('Product not found');
          setIsLoading(false);
          return;
        }

        // Type guard untuk product data
        if (!('title' in productData) || !('image_url' in productData)) {
          setError('Invalid product data');
          setIsLoading(false);
          return;
        }

        setProduct(productData as Product);

        // Fetch other user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', params.userId)
          .single();

        if (userError || !userData) {
          setError('User not found');
          setIsLoading(false);
          return;
        }

        // Type guard untuk user data
        if (!('name' in userData)) {
          setError('Invalid user data');
          setIsLoading(false);
          return;
        }

        setOtherUser(userData as User);

        // Fetch existing messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            message,
            created_at,
            sender_id,
            receiver_id,
            sender:users(name)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`)
          .eq('product_id', params.productId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        // Type guard untuk messages data
        if (messagesData && Array.isArray(messagesData)) {
          const validMessages = messagesData
            .filter((msg): msg is SupabaseMessage => {
              return (
                msg !== null &&
                typeof msg === 'object' &&
                'id' in msg &&
                'message' in msg &&
                'created_at' in msg &&
                'sender_id' in msg &&
                'receiver_id' in msg &&
                'sender' in msg &&
                typeof msg.sender === 'object' &&
                msg.sender !== null &&
                'name' in msg.sender
              );
            })
            .map(msg => ({
              id: msg.id,
              message: msg.message,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id,
              sender: {
                name: msg.sender.name
              }
            }));
          setMessages(validMessages);
        }

        // Subscribe to new messages
        const subscription = supabase
          .channel(`product_${params.productId}`)
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages',
              filter: `product_id=eq.${params.productId}`
            }, 
            (payload) => {
              const newMessage = payload.new as Message;
              if ((newMessage.sender_id === user.id && newMessage.receiver_id === params.userId) ||
                  (newMessage.sender_id === params.userId && newMessage.receiver_id === user.id)) {
                setMessages(prev => [...prev, newMessage]);
              }
            }
          )
          .subscribe();

        setIsLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error:', error);
        setError('An error occurred');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.productId, params.userId, router, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          product_id: params.productId,
          sender_id: user.id,
          receiver_id: params.userId,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{error}</h1>
          <Link href="/chat" className="mt-4 text-primary hover:text-primary/90">
            Back to chats
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !otherUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Chat not found</h1>
          <Link href="/chat" className="mt-4 text-primary hover:text-primary/90">
            Back to chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12">
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  sizes="48px"
                  className="object-cover rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">{product.title}</h1>
                <p className="text-sm text-gray-500">Chat with {otherUser.name}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[calc(100vh-300px)] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === params.userId ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === params.userId
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-primary text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 