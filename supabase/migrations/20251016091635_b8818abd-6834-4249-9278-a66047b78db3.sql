-- Восстанавливаем whitelist для toplikehot.tg вручную (если у него действительно есть NFT)
-- Администратор может проверить и подтвердить наличие NFT у пользователя

-- Функция для восстановления whitelist для пользователя с NFT
CREATE OR REPLACE FUNCTION public.admin_restore_nft_whitelist(
  p_wallet_address text,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Проверка прав администратора
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT is_admin_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can restore NFT whitelist';
  END IF;

  -- Обновляем или создаем запись в whitelist
  INSERT INTO public.whitelist (
    wallet_address,
    added_by_wallet_address,
    notes,
    whitelist_source,
    nft_contract_used,
    is_active
  ) VALUES (
    p_wallet_address,
    p_admin_wallet_address,
    'Восстановлен администратором после сбоя проверки NFT',
    'nft_automatic',
    'golden_ticket.nfts.tg',
    true
  )
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    is_active = true,
    whitelist_source = 'nft_automatic',
    nft_contract_used = 'golden_ticket.nfts.tg',
    notes = 'Восстановлен администратором после сбоя проверки NFT',
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Восстанавливаем whitelist для toplikehot.tg
SELECT public.admin_restore_nft_whitelist('toplikehot.tg', 'mr_bruts.tg');