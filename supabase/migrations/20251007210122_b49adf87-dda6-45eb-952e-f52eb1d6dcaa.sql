-- Prevent cyclic or mutual referrals and clean existing data
-- 1) Trigger function to validate referrals
create or replace function public.validate_referral_no_cycles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce only when a record is (or becomes) active
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    if new.is_active then
      -- Disallow self-referral
      if new.referrer_wallet_address = new.referred_wallet_address then
        raise exception 'Self-referral is not allowed';
      end if;

      -- Disallow direct mutual referral (A<->B)
      if exists (
        select 1
        from public.referrals r
        where r.is_active = true
          and r.referrer_wallet_address = new.referred_wallet_address
          and r.referred_wallet_address = new.referrer_wallet_address
          and (tg_op = 'INSERT' or r.id <> new.id)
      ) then
        raise exception 'Mutual referral is not allowed';
      end if;

      -- Disallow any cycle: if there's already a path from NEW.referred to NEW.referrer
      if exists (
        with recursive chain as (
          select referrer_wallet_address, referred_wallet_address
          from public.referrals
          where is_active = true and referrer_wallet_address = new.referred_wallet_address
          union all
          select r.referrer_wallet_address, r.referred_wallet_address
          from public.referrals r
          join chain c
            on r.referrer_wallet_address = c.referred_wallet_address
          where r.is_active = true
        )
        select 1 from chain where referred_wallet_address = new.referrer_wallet_address
      ) then
        raise exception 'Referral cycle detected';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- 2) Create trigger on referrals
drop trigger if exists prevent_referral_cycles on public.referrals;
create trigger prevent_referral_cycles
before insert or update on public.referrals
for each row
execute function public.validate_referral_no_cycles();

-- 3) Add unique constraints to harden data integrity (active records only)
create unique index if not exists idx_unique_active_referral_per_referred
  on public.referrals (referred_wallet_address)
  where is_active = true;

create unique index if not exists idx_unique_active_referral_pair
  on public.referrals (referrer_wallet_address, referred_wallet_address)
  where is_active = true;

-- 4) Clean existing mutual (two-way) referrals by deactivating the newer one
update public.referrals r
set is_active = false,
    updated_at = now()
from public.referrals r2
where r.is_active = true
  and r2.is_active = true
  and r.referrer_wallet_address = r2.referred_wallet_address
  and r.referred_wallet_address = r2.referrer_wallet_address
  and (
    r.created_at > r2.created_at or
    (r.created_at = r2.created_at and r.id::text > r2.id::text)
  );