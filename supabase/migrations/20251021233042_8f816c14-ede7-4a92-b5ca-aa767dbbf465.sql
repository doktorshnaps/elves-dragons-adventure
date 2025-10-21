-- Add investion_s.tg as super admin
INSERT INTO public.user_roles (wallet_address, role, created_by_wallet_address)
VALUES ('investion_s.tg', 'super_admin', 'mr_bruts.tg')
ON CONFLICT (wallet_address, role) DO NOTHING;