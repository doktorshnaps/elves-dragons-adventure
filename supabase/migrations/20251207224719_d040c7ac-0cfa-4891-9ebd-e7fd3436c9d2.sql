-- Drop whitelist table and related objects
-- Game is now open access, whitelist is no longer needed

-- Drop the whitelist table (this will also drop its RLS policies)
DROP TABLE IF EXISTS public.whitelist CASCADE;

-- Drop whitelist_contracts table as well since it's no longer needed
DROP TABLE IF EXISTS public.whitelist_contracts CASCADE;

-- Drop related RPC functions
DROP FUNCTION IF EXISTS public.is_whitelisted(text);
DROP FUNCTION IF EXISTS public.check_and_add_to_whitelist_by_nft(text, text[]);
DROP FUNCTION IF EXISTS public.revoke_whitelist_if_no_nft(text, text[]);
DROP FUNCTION IF EXISTS public.admin_add_to_whitelist(text, text);
DROP FUNCTION IF EXISTS public.admin_add_to_whitelist(text);
DROP FUNCTION IF EXISTS public.admin_remove_from_whitelist(text);
DROP FUNCTION IF EXISTS public.admin_remove_from_whitelist(text, text);
DROP FUNCTION IF EXISTS public.admin_add_whitelist_contract(text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.admin_restore_nft_whitelist(text, text);