-- Удаляем все card_instances для тестового пользователя
DELETE FROM card_instances WHERE wallet_address = 'doktorshnaps.tg';

-- Добавляем функцию для принудительной очистки card_instances пользователя
CREATE OR REPLACE FUNCTION admin_clear_user_card_instances(p_wallet_address text, p_admin_wallet_address text DEFAULT 'mr_bruts.tg')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can clear card instances';
  END IF;

  -- Delete all card instances for the user
  DELETE FROM card_instances WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;