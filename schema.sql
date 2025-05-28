-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Products can be created by authenticated users"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Products can be updated by their sellers"
ON products FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Products can be deleted by their sellers"
ON products FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create policies for users
CREATE POLICY "User profiles are viewable by everyone"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 