-- Создаем функцию для обновления настроек подземелий с новыми полями роста
CREATE OR REPLACE FUNCTION public.admin_update_dungeon_setting(
  p_id uuid,
  p_base_hp integer,
  p_base_armor integer,
  p_base_atk integer,
  p_hp_growth numeric,
  p_armor_growth numeric,
  p_atk_growth numeric,
  p_hp_growth_old numeric DEFAULT NULL,
  p_armor_growth_old numeric DEFAULT NULL,
  p_atk_growth_old numeric DEFAULT NULL,
  p_s_mob_base numeric DEFAULT NULL,
  p_dungeon_alpha numeric DEFAULT NULL,
  p_level_beta numeric DEFAULT NULL,
  p_level_g_coefficient numeric DEFAULT NULL,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Проверка прав администратора
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT is_admin_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update dungeon settings';
  END IF;

  -- Обновляем настройки подземелья
  UPDATE public.dungeon_settings
  SET 
    base_hp = p_base_hp,
    base_armor = p_base_armor,
    base_atk = p_base_atk,
    hp_growth = p_hp_growth,
    armor_growth = p_armor_growth,
    atk_growth = p_atk_growth,
    hp_growth_coefficient = COALESCE(p_hp_growth_old, hp_growth_coefficient),
    armor_growth_coefficient = COALESCE(p_armor_growth_old, armor_growth_coefficient),
    atk_growth_coefficient = COALESCE(p_atk_growth_old, atk_growth_coefficient),
    s_mob_base = COALESCE(p_s_mob_base, s_mob_base),
    dungeon_alpha = COALESCE(p_dungeon_alpha, dungeon_alpha),
    level_beta = COALESCE(p_level_beta, level_beta),
    level_g_coefficient = COALESCE(p_level_g_coefficient, level_g_coefficient),
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;