-- Create marketplace_listings table
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  buyer_id uuid null,
  type text not null check (type in ('card','item')),
  item jsonb not null,
  price integer not null check (price > 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  created_at timestamptz not null default now(),
  sold_at timestamptz null
);

-- Enable RLS
alter table public.marketplace_listings enable row level security;

-- Policies
-- Anyone can view active listings
create policy if not exists "Anyone can view active listings"
  on public.marketplace_listings
  for select
  using (status = 'active');

-- Sellers can view their own listings
create policy if not exists "Sellers can view their own listings"
  on public.marketplace_listings
  for select
  using (auth.uid() = seller_id);

-- Buyers can view their purchased listings
create policy if not exists "Buyers can view their purchased listings"
  on public.marketplace_listings
  for select
  using (auth.uid() = buyer_id);

-- Users can create their own listings
create policy if not exists "Users can create their own listings"
  on public.marketplace_listings
  for insert
  with check (auth.uid() = seller_id);

-- Sellers can update their own listings (e.g., cancel)
create policy if not exists "Sellers can update their own listings"
  on public.marketplace_listings
  for update
  using (auth.uid() = seller_id);

-- Buyers can mark listing as purchased
create policy if not exists "Buyers can mark listing as purchased"
  on public.marketplace_listings
  for update
  using (status = 'active')
  with check (buyer_id = auth.uid());

-- Helpful indexes
create index if not exists idx_marketplace_listings_status_created_at on public.marketplace_listings(status, created_at desc);
create index if not exists idx_marketplace_listings_seller on public.marketplace_listings(seller_id);

-- Realtime support
alter table public.marketplace_listings replica identity full;
-- Add to publication if not already present
-- Note: This will fail if the publication doesn't exist; Supabase provides supabase_realtime by default
alter publication supabase_realtime add table public.marketplace_listings;

-- Create a public storage bucket for game assets
insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;

-- Storage policies for the bucket
-- Public can read assets
create policy if not exists "Public can read game assets"
  on storage.objects
  for select
  using (bucket_id = 'game-assets');

-- Authenticated users can upload to the bucket
create policy if not exists "Users can upload game assets"
  on storage.objects
  for insert
  with check (bucket_id = 'game-assets');

-- Authenticated users can update their own uploads (optional)
create policy if not exists "Users can update their game assets"
  on storage.objects
  for update
  using (bucket_id = 'game-assets' and owner = auth.uid());
