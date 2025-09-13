-- Add admin to whitelist
INSERT INTO public.whitelist (wallet_address, added_by_wallet_address, notes) 
VALUES ('mr_bruts.tg', 'mr_bruts.tg', 'Admin account - full access') 
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_active = true, 
  notes = 'Admin account - full access', 
  updated_at = now();