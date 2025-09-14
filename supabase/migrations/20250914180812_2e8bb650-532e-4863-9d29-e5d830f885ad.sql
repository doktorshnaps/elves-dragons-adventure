-- Улучшаем существующую таблицу card_instances для лучшего управления здоровьем
ALTER TABLE public.card_instances 
ADD COLUMN IF NOT EXISTS is_in_medical_bay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_bay_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS medical_bay_heal_rate integer DEFAULT 1;

-- Создаем таблицу для медпункта
CREATE TABLE IF NOT EXISTS public.medical_bay (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  wallet_address text,
  card_instance_id uuid NOT NULL REFERENCES public.card_instances(id) ON DELETE CASCADE,
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  estimated_completion timestamp with time zone,
  heal_rate integer NOT NULL DEFAULT 10, -- 10 HP в минуту в медпункте
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаем RLS для медпункта
ALTER TABLE public.medical_bay ENABLE ROW LEVEL SECURITY;

-- Политики для медпункта
CREATE POLICY "Users can view their own medical bay entries"
ON public.medical_bay
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "Users can insert their own medical bay entries"
ON public.medical_bay
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "Users can update their own medical bay entries"
ON public.medical_bay
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL) AND 
  ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "Users can delete their own medical bay entries"
ON public.medical_bay
FOR DELETE
USING (
  (auth.uid() IS NOT NULL) AND 
  ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet()))
);

-- Функция для помещения карты в медпункт
CREATE OR REPLACE FUNCTION public.place_card_in_medical_bay(
  p_card_instance_id uuid,
  p_wallet_address text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_card_instance RECORD;
  v_user_id uuid;
  v_medical_bay_id uuid;
  v_estimated_completion timestamp with time zone;
  v_heal_time_minutes integer;
BEGIN
  -- Получаем информацию о карте
  SELECT * INTO v_card_instance
  FROM public.card_instances ci
  WHERE ci.id = p_card_instance_id 
    AND ci.wallet_address = p_wallet_address;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card instance not found or not owned by user';
  END IF;
  
  -- Проверяем, что карта не на полном здоровье
  IF v_card_instance.current_health >= v_card_instance.max_health THEN
    RAISE EXCEPTION 'Card is already at full health';
  END IF;
  
  -- Проверяем, что карта не уже в медпункте
  IF EXISTS (
    SELECT 1 FROM public.medical_bay mb 
    WHERE mb.card_instance_id = p_card_instance_id 
      AND mb.is_completed = false
  ) THEN
    RAISE EXCEPTION 'Card is already in medical bay';
  END IF;
  
  v_user_id := v_card_instance.user_id;
  
  -- Вычисляем время лечения (до полного здоровья)
  v_heal_time_minutes := v_card_instance.max_health - v_card_instance.current_health;
  v_estimated_completion := now() + (v_heal_time_minutes || ' minutes')::interval;
  
  -- Помещаем карту в медпункт
  INSERT INTO public.medical_bay (
    user_id,
    wallet_address,
    card_instance_id,
    estimated_completion,
    heal_rate
  ) VALUES (
    v_user_id,
    p_wallet_address,
    p_card_instance_id,
    v_estimated_completion,
    10
  ) RETURNING id INTO v_medical_bay_id;
  
  -- Обновляем статус карты
  UPDATE public.card_instances
  SET is_in_medical_bay = true,
      medical_bay_start_time = now(),
      medical_bay_heal_rate = 10,
      updated_at = now()
  WHERE id = p_card_instance_id;
  
  RETURN jsonb_build_object(
    'medical_bay_id', v_medical_bay_id,
    'estimated_completion', v_estimated_completion,
    'message', 'Card placed in medical bay successfully'
  );
END;
$$;

-- Функция для удаления карты из медпункта
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay(
  p_card_instance_id uuid,
  p_wallet_address text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_medical_bay RECORD;
  v_healed_amount integer;
  v_new_health integer;
  v_card_instance RECORD;
BEGIN
  -- Находим запись в медпункте
  SELECT * INTO v_medical_bay
  FROM public.medical_bay mb
  WHERE mb.card_instance_id = p_card_instance_id 
    AND mb.wallet_address = p_wallet_address
    AND mb.is_completed = false;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in medical bay';
  END IF;
  
  -- Получаем информацию о карте
  SELECT * INTO v_card_instance
  FROM public.card_instances ci
  WHERE ci.id = p_card_instance_id;
  
  -- Вычисляем количество восстановленного здоровья
  v_healed_amount := LEAST(
    EXTRACT(EPOCH FROM (now() - v_medical_bay.placed_at)) / 60 * v_medical_bay.heal_rate,
    v_card_instance.max_health - v_card_instance.current_health
  )::integer;
  
  v_new_health := LEAST(
    v_card_instance.current_health + v_healed_amount,
    v_card_instance.max_health
  );
  
  -- Обновляем здоровье карты
  UPDATE public.card_instances
  SET current_health = v_new_health,
      is_in_medical_bay = false,
      medical_bay_start_time = null,
      medical_bay_heal_rate = 1,
      last_heal_time = now(),
      updated_at = now()
  WHERE id = p_card_instance_id;
  
  -- Помечаем лечение как завершенное
  UPDATE public.medical_bay
  SET is_completed = true,
      updated_at = now()
  WHERE id = v_medical_bay.id;
  
  RETURN jsonb_build_object(
    'healed_amount', v_healed_amount,
    'new_health', v_new_health,
    'max_health', v_card_instance.max_health,
    'message', 'Card removed from medical bay'
  );
END;
$$;

-- Функция для автоматического процесса лечения
CREATE OR REPLACE FUNCTION public.process_medical_bay_healing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  medical_record RECORD;
  v_healed_amount integer;
  v_new_health integer;
BEGIN
  -- Обрабатываем все активные записи в медпункте
  FOR medical_record IN 
    SELECT mb.*, ci.current_health, ci.max_health
    FROM public.medical_bay mb
    JOIN public.card_instances ci ON ci.id = mb.card_instance_id
    WHERE mb.is_completed = false
      AND mb.estimated_completion <= now()
  LOOP
    -- Вычисляем полное восстановление
    v_new_health := medical_record.max_health;
    v_healed_amount := v_new_health - medical_record.current_health;
    
    -- Обновляем здоровье карты
    UPDATE public.card_instances
    SET current_health = v_new_health,
        is_in_medical_bay = false,
        medical_bay_start_time = null,
        medical_bay_heal_rate = 1,
        last_heal_time = now(),
        updated_at = now()
    WHERE id = medical_record.card_instance_id;
    
    -- Помечаем лечение как завершенное
    UPDATE public.medical_bay
    SET is_completed = true,
        updated_at = now()
    WHERE id = medical_record.id;
  END LOOP;
END;
$$;

-- Создаем триггер для обновления updated_at
CREATE TRIGGER update_medical_bay_updated_at
  BEFORE UPDATE ON public.medical_bay
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();