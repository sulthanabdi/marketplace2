export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          image_url: string
          condition: string
          user_id: string
          is_sold: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          image_url: string
          condition: string
          user_id: string
          is_sold?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          image_url?: string
          condition?: string
          user_id?: string
          is_sold?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          whatsapp: string | null
          role: 'user' | 'admin'
          bank_code: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          withdrawal_method: string | null
          withdrawal_account: string | null
          withdrawal_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          whatsapp?: string | null
          role?: 'user' | 'admin'
          bank_code?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          withdrawal_method?: string | null
          withdrawal_account?: string | null
          withdrawal_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          whatsapp?: string | null
          role?: 'user' | 'admin'
          bank_code?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          withdrawal_method?: string | null
          withdrawal_account?: string | null
          withdrawal_name?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          product_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          product_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          product_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Extended types for components
export type Product = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string;
    whatsapp: string;
  } | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  role: 'user' | 'admin';
  bank_code: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  withdrawal_method: string | null;
  withdrawal_account: string | null;
  withdrawal_name: string | null;
  created_at: string;
};

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Message = Database['public']['Tables']['messages']['Row']; 