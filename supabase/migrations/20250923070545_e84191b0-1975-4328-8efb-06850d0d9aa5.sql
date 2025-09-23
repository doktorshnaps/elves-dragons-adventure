-- Создаем таблицу для управления контрактами вайт-листа
CREATE TABLE public.whitelist_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_address TEXT NOT NULL UNIQUE,
  contract_name TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by_wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.whitelist_contracts ENABLE ROW LEVEL SECURITY;

-- Политики RLS для контрактов вайт-листа
CREATE POLICY "Admins can manage whitelist contracts" 
ON public.whitelist_contracts 
FOR ALL
USING (added_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());

CREATE POLICY "Anyone can read active whitelist contracts" 
ON public.whitelist_contracts 
FOR SELECT 
USING (is_active = true);

-- Добавляем дефолтный контракт golden_ticket
INSERT INTO public.whitelist_contracts (
  contract_address, 
  contract_name, 
  description, 
  added_by_wallet_address
) VALUES (
  'golden_ticket.nfts.tg',
  'Golden Ticket NFTs',
  'Автоматический вайт-лист для держателей Golden Ticket NFT',
  'mr_bruts.tg'
);

-- Функция для проверки и добавления в вайт-лист по NFT
CREATE OR REPLACE FUNCTION public.check_and_add_to_whitelist_by_nft(
  p_wallet_address TEXT,
  p_nft_contracts TEXT[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_whitelist_contract RECORD;
  v_has_qualifying_nft BOOLEAN := false;
BEGIN
  IF p_wallet_address IS NULL OR array_length(p_nft_contracts, 1) IS NULL THEN
    RETURN false;
  END IF;

  -- Проверяем каждый контракт из списка активных вайт-лист контрактов
  FOR v_whitelist_contract IN 
    SELECT contract_address 
    FROM public.whitelist_contracts 
    WHERE is_active = true
  LOOP
    -- Если у пользователя есть NFT из этого контракта
    IF v_whitelist_contract.contract_address = ANY(p_nft_contracts) THEN
      v_has_qualifying_nft := true;
      EXIT; -- Достаточно одного совпадения
    END IF;
  END LOOP;

  -- Если найден подходящий NFT, добавляем в вайт-лист
  IF v_has_qualifying_nft THEN
    INSERT INTO public.whitelist (
      wallet_address, 
      added_by_wallet_address, 
      notes
    ) VALUES (
      p_wallet_address,
      'system_nft_checker',
      'Добавлен автоматически за NFT'
    )
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      is_active = true,
      notes = 'Подтвержден автоматически за NFT',
      updated_at = now();
      
    RETURN true;
  END IF;

  RETURN false;
END;
$$;