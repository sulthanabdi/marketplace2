# Deployment Guide

## Prerequisites
- Node.js 18 or later
- npm or yarn
- Supabase account
- Vercel account

## Supabase Setup

1. Create a new project in Supabase
2. Get your project URL and anon key from the project settings
3. Create the following tables in your Supabase database:

```sql
-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null unique,
  whatsapp text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Create products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price integer not null,
  image_url text not null,
  condition text not null,
  seller_id uuid references public.users not null,
  is_sold boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;

-- Create policies
create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Users can create products"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "Users can update their own products"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "Users can delete their own products"
  on public.products for delete
  using (auth.uid() = seller_id);

-- Create wishlists table
create table public.wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  product_id uuid references public.products not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable RLS
alter table public.wishlists enable row level security;

-- Create policies
create policy "Users can view their own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can add to their wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from their wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);

-- Create messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users not null,
  receiver_id uuid references public.users not null,
  product_id uuid references public.products not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create policies
create policy "Users can view their messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Create notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id);
```

4. Create a storage bucket for product images:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named 'products'
   - Set the bucket's privacy to private
   - Add the following policy to allow authenticated users to upload images:

```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');
```

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Create a new project in Vercel
3. Connect your repository
4. Add the environment variables from your `.env.local` file
5. Deploy your project

## Post-Deployment

1. Verify that all tables are created correctly in Supabase
2. Test the authentication flow
3. Test file uploads to the storage bucket
4. Test real-time features

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check if your Supabase URL and anon key are correct
   - Verify that email/password authentication is enabled in Supabase

2. **Database Errors**
   - Ensure all tables are created with the correct structure
   - Check RLS policies are properly configured

3. **Storage Errors**
   - Verify the storage bucket exists
   - Check storage policies are correctly set up

4. **Real-time Issues**
   - Ensure real-time features are enabled in Supabase
   - Check if the correct channels are subscribed to 