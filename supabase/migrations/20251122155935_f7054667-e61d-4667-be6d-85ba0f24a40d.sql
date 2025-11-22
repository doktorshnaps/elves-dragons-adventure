-- Fix shop_settings duplicate entries issue
-- Step 1: Clean up duplicate entries, keeping only the latest one
DO $$
DECLARE
  v_latest_id uuid;
BEGIN
  -- Get the ID of the latest settings entry
  SELECT id INTO v_latest_id
  FROM public.shop_settings
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Delete all entries except the latest one
  DELETE FROM public.shop_settings
  WHERE id != v_latest_id;
  
  RAISE NOTICE 'Cleaned up duplicate shop_settings entries, kept ID: %', v_latest_id;
END $$;

-- Step 2: Add singleton column with unique constraint to prevent future duplicates
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS singleton boolean NOT NULL DEFAULT true;

-- Create unique index to ensure only one row exists
DROP INDEX IF EXISTS idx_shop_settings_singleton;
CREATE UNIQUE INDEX idx_shop_settings_singleton ON public.shop_settings(singleton);

-- Step 3: Fix admin_update_shop_settings function to use proper UPSERT
CREATE OR REPLACE FUNCTION public.admin_update_shop_settings(
  p_admin_wallet_address text,
  p_items_per_refresh integer,
  p_refresh_interval_hours integer,
  p_is_open_access boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update shop settings';
  END IF;

  -- Upsert settings using singleton constraint
  INSERT INTO public.shop_settings (
    items_per_refresh,
    refresh_interval_hours,
    is_open_access,
    created_by_wallet_address,
    singleton,
    updated_at
  )
  VALUES (
    p_items_per_refresh,
    p_refresh_interval_hours,
    p_is_open_access,
    p_admin_wallet_address,
    true,
    now()
  )
  ON CONFLICT (singleton) DO UPDATE
  SET
    items_per_refresh = EXCLUDED.items_per_refresh,
    refresh_interval_hours = EXCLUDED.refresh_interval_hours,
    is_open_access = EXCLUDED.is_open_access,
    updated_at = now();

  RETURN true;
END;
$$;