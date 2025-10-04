-- Admin function to update hero base stats
CREATE OR REPLACE FUNCTION public.admin_update_hero_base_stats(
  p_health integer,
  p_defense integer,
  p_power integer,
  p_magic integer,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update hero base stats';
  END IF;

  -- Update hero base stats
  UPDATE public.hero_base_stats
  SET 
    health = p_health,
    defense = p_defense,
    power = p_power,
    magic = p_magic,
    updated_at = now()
  WHERE id IS NOT NULL;

  RETURN TRUE;
END;
$$;

-- Admin function to update dragon base stats
CREATE OR REPLACE FUNCTION public.admin_update_dragon_base_stats(
  p_health integer,
  p_defense integer,
  p_power integer,
  p_magic integer,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update dragon base stats';
  END IF;

  -- Update dragon base stats
  UPDATE public.dragon_base_stats
  SET 
    health = p_health,
    defense = p_defense,
    power = p_power,
    magic = p_magic,
    updated_at = now()
  WHERE id IS NOT NULL;

  RETURN TRUE;
END;
$$;

-- Admin function to update class multipliers
CREATE OR REPLACE FUNCTION public.admin_update_class_multiplier(
  p_id uuid,
  p_health_multiplier numeric,
  p_defense_multiplier numeric,
  p_power_multiplier numeric,
  p_magic_multiplier numeric,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update class multipliers';
  END IF;

  -- Update class multiplier
  UPDATE public.class_multipliers
  SET 
    health_multiplier = p_health_multiplier,
    defense_multiplier = p_defense_multiplier,
    power_multiplier = p_power_multiplier,
    magic_multiplier = p_magic_multiplier,
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;

-- Admin function to update dragon class multipliers
CREATE OR REPLACE FUNCTION public.admin_update_dragon_class_multiplier(
  p_id uuid,
  p_health_multiplier numeric,
  p_defense_multiplier numeric,
  p_power_multiplier numeric,
  p_magic_multiplier numeric,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update dragon class multipliers';
  END IF;

  -- Update dragon class multiplier
  UPDATE public.dragon_class_multipliers
  SET 
    health_multiplier = p_health_multiplier,
    defense_multiplier = p_defense_multiplier,
    power_multiplier = p_power_multiplier,
    magic_multiplier = p_magic_multiplier,
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;

-- Admin function to update rarity multiplier
CREATE OR REPLACE FUNCTION public.admin_update_rarity_multiplier(
  p_id uuid,
  p_multiplier numeric,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update rarity multipliers';
  END IF;

  -- Update rarity multiplier
  UPDATE public.rarity_multipliers
  SET 
    multiplier = p_multiplier,
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;