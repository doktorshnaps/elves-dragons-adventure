-- Create function for adding to whitelist
CREATE OR REPLACE FUNCTION public.admin_add_to_whitelist(
  p_wallet_address text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_wallet text;
BEGIN
  -- Get current user's wallet
  v_admin_wallet := get_current_user_wallet();
  
  -- Check if user is admin
  IF NOT (v_admin_wallet = 'mr_bruts.tg' OR has_admin_role(v_admin_wallet)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add to whitelist';
  END IF;

  -- Insert or update whitelist entry
  INSERT INTO public.whitelist (
    wallet_address,
    added_by_wallet_address,
    notes,
    whitelist_source,
    is_active
  ) VALUES (
    p_wallet_address,
    v_admin_wallet,
    p_notes,
    'manual',
    true
  )
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    is_active = true,
    notes = COALESCE(EXCLUDED.notes, whitelist.notes),
    whitelist_source = 'manual',
    added_by_wallet_address = v_admin_wallet,
    updated_at = now();

  RETURN TRUE;
END;
$function$;