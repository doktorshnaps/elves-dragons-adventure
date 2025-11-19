-- Создаем RPC функцию для обновления текущей брони карточки по template_id
CREATE OR REPLACE FUNCTION public.update_card_instance_defense_by_template(
  p_wallet_address text,
  p_card_template_id text,
  p_current_defense integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE card_instances
  SET 
    current_defense = GREATEST(0, p_current_defense),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;
  
  RETURN FOUND;
END;
$$;

-- Создаем RPC функцию для обновления здоровья и брони одновременно
CREATE OR REPLACE FUNCTION public.update_card_instance_health_and_defense_by_template(
  p_wallet_address text,
  p_card_template_id text,
  p_current_health integer,
  p_current_defense integer,
  p_last_heal_time timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE card_instances
  SET 
    current_health = GREATEST(0, p_current_health),
    current_defense = GREATEST(0, p_current_defense),
    last_heal_time = COALESCE(p_last_heal_time, last_heal_time),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;
  
  RETURN FOUND;
END;
$$;