-- Fix card_instances constraints and add helper RPCs for wallet-based access
-- 1) Relax NOT NULL and enforce wallet/template uniqueness
ALTER TABLE public.card_instances
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.card_instances
  ALTER COLUMN wallet_address SET NOT NULL;

-- Prevent duplicates of the same template per wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_card_instances_wallet_template'
  ) THEN
    CREATE UNIQUE INDEX uq_card_instances_wallet_template
      ON public.card_instances (wallet_address, card_template_id);
  END IF;
END $$;

-- 2) List instances by wallet (bypass RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(p_wallet_address text)
RETURNS SETOF public.card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC;
END;
$$;

-- 3) Update health by wallet + template (for battle flows that don't have instance id)
CREATE OR REPLACE FUNCTION public.update_card_instance_health_by_template(
  p_wallet_address text,
  p_card_template_id text,
  p_current_health integer,
  p_last_heal_time timestamp with time zone DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR p_card_template_id IS NULL OR p_card_template_id = '' THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  UPDATE public.card_instances
  SET 
    current_health = LEAST(GREATEST(0, p_current_health), max_health),
    last_heal_time = COALESCE(p_last_heal_time, last_heal_time),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;

  RETURN FOUND;
END;
$$;

-- 4) Remove instance by wallet + template (used on burn/upgrade)
CREATE OR REPLACE FUNCTION public.remove_card_instance_by_wallet(
  p_wallet_address text,
  p_card_template_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_card_template_id IS NULL OR p_card_template_id = '' THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  DELETE FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- 5) Remove instance by id + wallet (for direct deletions)
CREATE OR REPLACE FUNCTION public.remove_card_instance_by_id(
  p_wallet_address text,
  p_instance_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF p_wallet_address IS NULL OR p_instance_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  DELETE FROM public.card_instances
  WHERE id = p_instance_id
    AND wallet_address = p_wallet_address;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;