-- Create admin function to update dungeon settings
CREATE OR REPLACE FUNCTION public.admin_update_dungeon_setting(
  p_id uuid,
  p_base_hp integer,
  p_base_armor integer,
  p_base_atk integer,
  p_hp_growth numeric,
  p_armor_growth numeric,
  p_atk_growth numeric,
  p_s_mob_base numeric,
  p_dungeon_alpha numeric,
  p_level_beta numeric,
  p_level_g_coefficient numeric,
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admin can update dungeon settings
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only super admin can update dungeon settings';
  END IF;

  UPDATE public.dungeon_settings
  SET 
    base_hp = p_base_hp,
    base_armor = p_base_armor,
    base_atk = p_base_atk,
    hp_growth_coefficient = p_hp_growth,
    armor_growth_coefficient = p_armor_growth,
    atk_growth_coefficient = p_atk_growth,
    s_mob_base = p_s_mob_base,
    dungeon_alpha = p_dungeon_alpha,
    level_beta = p_level_beta,
    level_g_coefficient = p_level_g_coefficient,
    updated_at = now()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dungeon setting not found: %', p_id;
  END IF;

  RETURN TRUE;
END;
$$;