'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ProductActions from '@/app/components/ProductActions';
import ProductDetail from './ProductDetail';
import PaymentButton from '@/app/components/PaymentButton';
import { useWishlist } from '@/app/context/WishlistContext';
import { WishlistProvider } from '@/app/context/WishlistContext';
import { useEffect, useState } from 'react';

type ProductWithSeller = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  user_id: string;
  is_sold: boolean;
  created_at: string;
  seller: {
    name: string;
    whatsapp: string;
  };
};

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  condition: string;
  user_id: string;
  is_sold: boolean;
  created_at: string;
  seller_name: string;
  seller_whatsapp: string;
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
}

function ChatBox({ productId, sellerId, userId }: { productId: string; sellerId: string; userId: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          receiver_id,
          sender:users(name)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${userId})`)
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data.map(msg => ({
        ...msg,
        sender_name: msg.sender.name
      })));
      setIsLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`product_${productId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `product_id=eq.${productId}`
        }, 
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if ((newMessage.sender_id === userId && newMessage.receiver_id === sellerId) ||
              (newMessage.sender_id === sellerId && newMessage.receiver_id === userId)) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, productId, sellerId, userId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        product_id: productId,
        sender_id: userId,
        receiver_id: sellerId,
        message: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  if (!userId) {
    return (
      <Link
        href="/login"
        className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 text-center block"
      >
        Login to Chat
      </Link>
    );
  }

  if (userId === sellerId) {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90"
      >
        {isOpen ? 'Close Chat' : 'Chat with Seller'}
      </button>

      {isOpen && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === userId
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
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
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
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
          </form>
        </div>
      )}
    </div>
  );
}

function ProductContent({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const { isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
        }

        const { data: productData, error: productError } = await supabase
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
          .eq('id', productId)
    .single();

  if (productError) {
    console.error('Error fetching product:', productError);
          return;
  }

        if (productData) {
          const unknownData = productData as unknown;
          const typedProduct = unknownData as ProductWithSeller;
          
          const formattedProduct: Product = {
            id: typedProduct.id,
            title: typedProduct.title,
            description: typedProduct.description,
            price: typedProduct.price,
            image_url: typedProduct.image_url,
            condition: typedProduct.condition,
            user_id: typedProduct.user_id,
            is_sold: typedProduct.is_sold,
            created_at: typedProduct.created_at,
            seller_name: typedProduct.seller.name,
            seller_whatsapp: typedProduct.seller.whatsapp.startsWith('+62')
              ? typedProduct.seller.whatsapp
              : typedProduct.seller.whatsapp.startsWith('0')
                ? '+62' + typedProduct.seller.whatsapp.slice(1)
                : '+62' + typedProduct.seller.whatsapp
  };
          setProduct(formattedProduct);
          setIsOwner(user?.id === typedProduct.user_id);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
  }
    };

    fetchProduct();
  }, [productId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Link href="/products" className="mt-4 text-primary hover:text-primary/90">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="relative h-96">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-lg"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
              <p className="mt-2 text-2xl font-medium text-primary">
                Rp {new Intl.NumberFormat('id-ID').format(product.price)}
              </p>
              <p className="mt-4 text-gray-600">{product.description}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Condition</h2>
                  <p className="mt-1 text-gray-600 capitalize">
                    {product.condition.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Seller</h2>
                  <p className="mt-1 text-gray-600">{product.seller_name}</p>
                </div>
                <ProductActions
                  productId={product.id}
                  sellerId={product.user_id}
                  sellerWhatsapp={product.seller_whatsapp}
                  title={product.title}
                  isOwner={isOwner}
                  isWishlisted={isInWishlist(product.id)}
                  isSold={product.is_sold}
                  userId={product.user_id}
                />
                {!isOwner && !product.is_sold && isAuthenticated && (
                  <div className="mt-6">
                    <PaymentButton 
                      productId={product.id}
                      amount={product.price}
                    />
                    <ChatBox 
                      productId={product.id}
                      sellerId={product.user_id}
                      userId={user?.id}
                    />
                  </div>
                )}
                {!isOwner && !product.is_sold && !isAuthenticated && (
                  <div className="mt-6">
                    <Link
                      href="/login"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-center block"
                    >
                      Login to Purchase
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <WishlistProvider>
      <ProductContent productId={params.id} />
    </WishlistProvider>
  );
} 