-- Add new profile fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS faculty text,
ADD COLUMN IF NOT EXISTS student_id text,
ADD COLUMN IF NOT EXISTS withdrawal_method text,
ADD COLUMN IF NOT EXISTS withdrawal_account text,
ADD COLUMN IF NOT EXISTS withdrawal_name text;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) NOT NULL,
    amount integer NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    withdrawal_method text NOT NULL,
    withdrawal_account text NOT NULL,
    withdrawal_name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update RLS policies to allow access to new fields
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

    -- Create new policies
    CREATE POLICY "Users can view their own profile"
        ON public.users FOR SELECT
        USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
        ON public.users FOR UPDATE
        USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
        ON public.users FOR INSERT
        WITH CHECK (auth.uid() = id);

    -- Add RLS policies for withdrawals table
    ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own withdrawals"
        ON public.withdrawals FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own withdrawals"
        ON public.withdrawals FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$; 