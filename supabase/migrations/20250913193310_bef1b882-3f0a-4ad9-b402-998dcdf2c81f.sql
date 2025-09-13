-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(p_wallet_address text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.banned_users 
    WHERE banned_wallet_address = p_wallet_address 
      AND is_active = true
  );
$function$