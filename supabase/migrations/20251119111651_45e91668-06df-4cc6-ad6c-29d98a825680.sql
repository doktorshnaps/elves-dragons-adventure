-- Создаем таблицу для кузницы (аналог medical_bay, но для восстановления брони)
CREATE TABLE IF NOT EXISTS public.forge_bay (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_address text,
  card_instance_id uuid NOT NULL REFERENCES card_instances(id) ON DELETE CASCADE,
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  estimated_completion timestamp with time zone,
  repair_rate integer NOT NULL DEFAULT 100,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_forge_bay_user_id ON forge_bay(user_id);
CREATE INDEX IF NOT EXISTS idx_forge_bay_wallet_address ON forge_bay(wallet_address);
CREATE INDEX IF NOT EXISTS idx_forge_bay_card_instance_id ON forge_bay(card_instance_id);
CREATE INDEX IF NOT EXISTS idx_forge_bay_is_completed ON forge_bay(is_completed);

-- RLS политики для forge_bay
ALTER TABLE forge_bay ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forge_bay_select_policy" ON forge_bay
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
  );

CREATE POLICY "forge_bay_insert_policy" ON forge_bay
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
  );

CREATE POLICY "forge_bay_update_policy" ON forge_bay
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
  );

CREATE POLICY "forge_bay_delete_policy" ON forge_bay
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
  );

-- RPC функция для добавления карты в кузницу
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(
  p_card_instance_id uuid,
  p_repair_hours integer DEFAULT 24,
  p_wallet_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_entry_id uuid;
  v_card_current_defense integer;
  v_card_max_defense integer;
  v_estimated_completion timestamp with time zone;
  v_repair_rate integer;
  v_existing_entry_id uuid;
BEGIN
  v_user_id := auth.uid();
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Проверяем, что карта не находится уже в кузнице
  SELECT id INTO v_existing_entry_id
  FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND is_completed = false
    AND (user_id = v_user_id OR wallet_address = v_wallet);

  IF v_existing_entry_id IS NOT NULL THEN
    RAISE EXCEPTION 'Card is already in forge bay';
  END IF;

  -- Получаем текущую и максимальную броню карты
  SELECT current_defense, max_defense
  INTO v_card_current_defense, v_card_max_defense
  FROM card_instances
  WHERE id = p_card_instance_id
    AND (user_id = v_user_id OR wallet_address = v_wallet);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or does not belong to user';
  END IF;

  -- Проверяем, нужно ли восстановление брони
  IF v_card_current_defense >= v_card_max_defense THEN
    RAISE EXCEPTION 'Card armor is already at maximum';
  END IF;

  -- Вычисляем скорость восстановления брони (единиц брони в час)
  v_repair_rate := GREATEST(1, CEIL((v_card_max_defense - v_card_current_defense)::numeric / p_repair_hours));
  
  -- Вычисляем время завершения
  v_estimated_completion := now() + (p_repair_hours || ' hours')::interval;

  -- Помечаем карту как находящуюся в кузнице
  UPDATE card_instances
  SET is_in_medical_bay = true
  WHERE id = p_card_instance_id;

  -- Создаем запись в кузнице
  INSERT INTO forge_bay (
    user_id,
    wallet_address,
    card_instance_id,
    placed_at,
    estimated_completion,
    repair_rate,
    is_completed
  ) VALUES (
    v_user_id,
    v_wallet,
    p_card_instance_id,
    now(),
    v_estimated_completion,
    v_repair_rate,
    false
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- RPC функция для получения записей кузницы
CREATE OR REPLACE FUNCTION public.get_forge_bay_entries(
  p_wallet_address text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  card_instance_id uuid,
  placed_at timestamp with time zone,
  estimated_completion timestamp with time zone,
  repair_rate integer,
  is_completed boolean,
  card_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
BEGIN
  v_user_id := auth.uid();
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    fb.id,
    fb.card_instance_id,
    fb.placed_at,
    fb.estimated_completion,
    fb.repair_rate,
    fb.is_completed,
    jsonb_build_object(
      'id', ci.id,
      'card_template_id', ci.card_template_id,
      'card_type', ci.card_type,
      'card_data', ci.card_data,
      'current_health', ci.current_health,
      'max_health', ci.max_health,
      'current_defense', ci.current_defense,
      'max_defense', ci.max_defense
    ) as card_data
  FROM forge_bay fb
  INNER JOIN card_instances ci ON fb.card_instance_id = ci.id
  WHERE fb.user_id = v_user_id OR fb.wallet_address = v_wallet
  ORDER BY fb.placed_at DESC;
END;
$$;

-- RPC функция для удаления карты из кузницы
CREATE OR REPLACE FUNCTION public.remove_card_from_forge_bay(
  p_card_instance_id uuid,
  p_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
BEGIN
  v_user_id := auth.uid();
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Удаляем запись из кузницы
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND (user_id = v_user_id OR wallet_address = v_wallet);

  -- Убираем флаг is_in_medical_bay с карты
  UPDATE card_instances
  SET is_in_medical_bay = false
  WHERE id = p_card_instance_id;

  RETURN FOUND;
END;
$$;

-- RPC функция для остановки восстановления без результата
CREATE OR REPLACE FUNCTION public.stop_repair_without_recovery(
  p_card_instance_id uuid,
  p_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
BEGIN
  v_user_id := auth.uid();
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Удаляем запись из кузницы
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND (user_id = v_user_id OR wallet_address = v_wallet);

  -- Убираем флаг is_in_medical_bay с карты
  UPDATE card_instances
  SET is_in_medical_bay = false
  WHERE id = p_card_instance_id;

  RETURN FOUND;
END;
$$;

-- RPC функция для обработки восстановления брони
CREATE OR REPLACE FUNCTION public.process_forge_bay_repair()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Обновляем броню для всех карт в кузнице
  UPDATE card_instances ci
  SET 
    current_defense = LEAST(
      ci.max_defense,
      ci.current_defense + (
        SELECT FLOOR(EXTRACT(EPOCH FROM (now() - fb.placed_at)) / 3600) * fb.repair_rate
        FROM forge_bay fb
        WHERE fb.card_instance_id = ci.id
          AND fb.is_completed = false
      )
    ),
    updated_at = now()
  FROM forge_bay fb
  WHERE ci.id = fb.card_instance_id
    AND fb.is_completed = false
    AND ci.current_defense < ci.max_defense;

  -- Помечаем завершенные записи
  UPDATE forge_bay
  SET is_completed = true
  WHERE is_completed = false
    AND card_instance_id IN (
      SELECT ci.id
      FROM card_instances ci
      WHERE ci.current_defense >= ci.max_defense
    );
END;
$$;