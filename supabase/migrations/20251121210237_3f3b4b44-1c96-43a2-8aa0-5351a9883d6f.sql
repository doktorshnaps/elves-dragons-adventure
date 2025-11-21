-- Create table for card class drop rates configuration
CREATE TABLE IF NOT EXISTS public.card_class_drop_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type TEXT NOT NULL, -- 'hero' or 'dragon'
  class_key TEXT NOT NULL, -- e.g. 'recruit', 'common', etc.
  class_name TEXT NOT NULL, -- Display name
  drop_chance DECIMAL(5,2) NOT NULL, -- Percentage, e.g. 16.61
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_wallet_address TEXT NOT NULL,
  UNIQUE(card_type, class_key)
);

-- Enable RLS
ALTER TABLE public.card_class_drop_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_class_drop_rates
CREATE POLICY "Public can view card class drop rates"
  ON public.card_class_drop_rates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert card class drop rates"
  ON public.card_class_drop_rates
  FOR INSERT
  WITH CHECK (
    public.is_admin_or_super_wallet(created_by_wallet_address)
  );

CREATE POLICY "Admins can update card class drop rates"
  ON public.card_class_drop_rates
  FOR UPDATE
  USING (
    public.is_admin_or_super_wallet(auth.jwt() ->> 'wallet_address')
  );

-- Insert default values for heroes
INSERT INTO public.card_class_drop_rates (card_type, class_key, class_name, drop_chance, display_order, created_by_wallet_address) VALUES
  ('hero', 'recruit', 'Рекрут', 16.61, 1, 'system'),
  ('hero', 'guard', 'Страж', 15.23, 2, 'system'),
  ('hero', 'veteran', 'Ветеран', 13.86, 3, 'system'),
  ('hero', 'wizard', 'Маг', 12.48, 4, 'system'),
  ('hero', 'healer', 'Мастер Целитель', 11.12, 5, 'system'),
  ('hero', 'defender', 'Защитник', 9.74, 6, 'system'),
  ('hero', 'veteran_defender', 'Ветеран Защитник', 8.36, 7, 'system'),
  ('hero', 'strategist', 'Стратег', 6.99, 8, 'system'),
  ('hero', 'supreme_strategist', 'Верховный Стратег', 5.61, 9, 'system')
ON CONFLICT (card_type, class_key) DO NOTHING;

-- Insert default values for dragons
INSERT INTO public.card_class_drop_rates (card_type, class_key, class_name, drop_chance, display_order, created_by_wallet_address) VALUES
  ('dragon', 'ordinary', 'Обычный', 16.61, 1, 'system'),
  ('dragon', 'unusual', 'Необычный', 15.23, 2, 'system'),
  ('dragon', 'rare', 'Редкий', 13.86, 3, 'system'),
  ('dragon', 'epic', 'Эпический', 12.48, 4, 'system'),
  ('dragon', 'legendary', 'Легендарный', 11.12, 5, 'system'),
  ('dragon', 'mythical', 'Мифический', 9.74, 6, 'system'),
  ('dragon', 'eternal', 'Этернал', 8.36, 7, 'system'),
  ('dragon', 'imperial', 'Империал', 6.99, 8, 'system'),
  ('dragon', 'titan', 'Титан', 5.61, 9, 'system')
ON CONFLICT (card_type, class_key) DO NOTHING;

-- Create RPC function to get card class drop rates
CREATE OR REPLACE FUNCTION public.get_card_class_drop_rates()
RETURNS TABLE (
  id UUID,
  card_type TEXT,
  class_key TEXT,
  class_name TEXT,
  drop_chance DECIMAL(5,2),
  display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ccdr.id,
    ccdr.card_type,
    ccdr.class_key,
    ccdr.class_name,
    ccdr.drop_chance,
    ccdr.display_order
  FROM public.card_class_drop_rates ccdr
  ORDER BY ccdr.card_type, ccdr.display_order;
END;
$$;

-- Create RPC function to update card class drop rates
CREATE OR REPLACE FUNCTION public.admin_update_card_class_drop_rates(
  p_admin_wallet_address TEXT,
  p_rates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate JSONB;
BEGIN
  -- Check admin access
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update card class drop rates';
  END IF;

  -- Update each rate
  FOR v_rate IN SELECT * FROM jsonb_array_elements(p_rates)
  LOOP
    UPDATE public.card_class_drop_rates
    SET 
      drop_chance = (v_rate->>'drop_chance')::DECIMAL(5,2),
      class_name = v_rate->>'class_name',
      updated_at = now()
    WHERE id = (v_rate->>'id')::UUID;
  END LOOP;

  RETURN TRUE;
END;
$$;