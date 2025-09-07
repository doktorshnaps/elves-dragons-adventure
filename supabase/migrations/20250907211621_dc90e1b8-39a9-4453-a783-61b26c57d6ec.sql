-- 1) Create table for stable wallet identities
create table if not exists public.wallet_identities (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.wallet_identities enable row level security;

-- Minimal policies: allow inserts/updates/selects only when wallet_address is present
create policy "Wallet owners can view wallet identities"
  on public.wallet_identities
  for select
  using (wallet_address is not null);

create policy "Wallet owners can insert wallet identities"
  on public.wallet_identities
  for insert
  with check (wallet_address is not null);

create policy "Wallet owners can update wallet identities"
  on public.wallet_identities
  for update
  using (wallet_address is not null);

-- 2) Function: get or create stable ID for wallet address
create or replace function public.get_or_create_wallet_identity(p_wallet_address text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_wallet_address is null or length(trim(p_wallet_address)) = 0 then
    raise exception 'wallet address required';
  end if;

  select id into v_id
  from public.wallet_identities
  where wallet_address = p_wallet_address;

  if v_id is null then
    insert into public.wallet_identities (wallet_address)
    values (p_wallet_address)
    on conflict (wallet_address) do update set wallet_address = excluded.wallet_address
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- 3) Link wallet_connections to wallet_identities
alter table public.wallet_connections
  add column if not exists identity_id uuid;

-- Backfill identity_id for existing rows
update public.wallet_connections wc
set identity_id = wi.id
from (
  select id, wallet_address from public.wallet_identities
) wi
where wc.wallet_address = wi.wallet_address and wc.identity_id is null;

-- For any wallet_address in wallet_connections not yet in wallet_identities, create rows
insert into public.wallet_identities (wallet_address)
select distinct wallet_address
from public.wallet_connections wc
where wc.wallet_address is not null
  and not exists (
    select 1 from public.wallet_identities wi where wi.wallet_address = wc.wallet_address
  );

-- Link again after inserts
update public.wallet_connections wc
set identity_id = wi.id
from public.wallet_identities wi
where wc.wallet_address = wi.wallet_address and wc.identity_id is null;

-- Add FK and index
alter table public.wallet_connections
  add constraint wallet_connections_identity_id_fkey
  foreign key (identity_id) references public.wallet_identities(id) on delete set null;

create index idx_wallet_connections_identity_id on public.wallet_connections(identity_id);