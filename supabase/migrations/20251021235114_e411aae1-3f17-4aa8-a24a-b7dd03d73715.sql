-- Fix whitelist_contracts RLS policies to include super_admin
DROP POLICY IF EXISTS "whitelist_contracts_unified_select_policy" ON whitelist_contracts;
DROP POLICY IF EXISTS "whitelist_contracts_insert_policy" ON whitelist_contracts;
DROP POLICY IF EXISTS "whitelist_contracts_update_policy" ON whitelist_contracts;
DROP POLICY IF EXISTS "whitelist_contracts_delete_policy" ON whitelist_contracts;

CREATE POLICY "whitelist_contracts_unified_select_policy" 
ON whitelist_contracts 
FOR SELECT 
USING (
  (is_active = true) OR 
  ((added_by_wallet_address = 'mr_bruts.tg'::text) OR is_admin_or_super_wallet(get_current_user_wallet()))
);

CREATE POLICY "whitelist_contracts_insert_policy" 
ON whitelist_contracts 
FOR INSERT 
WITH CHECK (
  (added_by_wallet_address = 'mr_bruts.tg'::text) OR is_admin_or_super_wallet(get_current_user_wallet())
);

CREATE POLICY "whitelist_contracts_update_policy" 
ON whitelist_contracts 
FOR UPDATE 
USING (
  (added_by_wallet_address = 'mr_bruts.tg'::text) OR is_admin_or_super_wallet(get_current_user_wallet())
);

CREATE POLICY "whitelist_contracts_delete_policy" 
ON whitelist_contracts 
FOR DELETE 
USING (
  (added_by_wallet_address = 'mr_bruts.tg'::text) OR is_admin_or_super_wallet(get_current_user_wallet())
);