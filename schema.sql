-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  condition TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  is_sold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

-- Create policies for products
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create products"
ON products FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON products FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON products FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Drop existing policies for users table
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new policies for users table
CREATE POLICY "User profiles are viewable by everyone"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
TO public
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO public
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages"
ON messages FOR UPDATE
TO public
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'products';

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'products';

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'products';

-- Check data in products table
SELECT * FROM products;

-- Check data in users table
SELECT * FROM users;

-- Check foreign key relationship
SELECT 
    p.id as product_id,
    p.title,
    p.user_id,
    u.id as user_id,
    u.name as user_name
FROM 
    products p
    LEFT JOIN users u ON p.user_id = u.id; 