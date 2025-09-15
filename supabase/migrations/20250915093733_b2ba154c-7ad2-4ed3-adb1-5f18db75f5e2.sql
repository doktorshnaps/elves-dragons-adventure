-- Create card_instances table and RPCs, idempotent
-- 1) Table
CREATE TABLE IF NOT EXISTS public.card_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  wallet_address text NOT NULL,
  card_template_id text NOT NULL,
  card_type text NOT NULL,
  current_health integer NOT NULL DEFAULT 0,
  max_health integer NOT NULL DEFAULT 0,
  last_heal_time timestamp with time zone NOT NULL DEFAULT now(),
  card_data jsonb NOT NULL,
  is_in_medical_bay boolean NOT NULL DEFAULT false,
  medical_bay_start_time timestamp with time zone NULL,
  medical_bay_heal_rate integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.card_instances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='card_instances' AND policyname='Users can view their own card instances'
  ) THEN
    CREATE POLICY "Users can view their own card instances"
      ON public.card_instances FOR SELECT
      USING ((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet())));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='card_instances' AND policyname='Users can insert their own card instances'
  ) THEN
    CREATE POLICY "Users can insert their own card instances"
      ON public.card_instances FOR INSERT
      WITH CHECK ((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet())));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='card_instances' AND policyname='Users can update their own card instances'
  ) THEN
    CREATE POLICY "Users can update their own card instances"
      ON public.card_instances FOR UPDATE
      USING ((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet())));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='card_instances' AND policyname='Users can delete their own card instances'
  ) THEN
    CREATE POLICY "Users can delete their own card instances"
      ON public.card_instances FOR DELETE
      USING ((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR (wallet_address = get_current_user_wallet())));
  END IF;
END$$;

-- 3) Unique index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_card_instances_wallet_template'
  ) THEN
    CREATE UNIQUE INDEX uq_card_instances_wallet_template
      ON public.card_instances (wallet_address, card_template_id);
  END IF;
END $$;

-- 4) RPCs
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(p_wallet_address text)
RETURNS SETOF public.card_instances
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  RETURN QUERY SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC;
END;$$;

CREATE OR REPLACE FUNCTION public.update_card_instance_health_by_template(
  p_wallet_address text,
  p_card_template_id text,
  p_current_health integer,
  p_last_heal_time timestamp with time zone DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR p_card_template_id IS NULL OR p_card_template_id = '' THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;
  UPDATE public.card_instances
  SET current_health = LEAST(GREATEST(0, p_current_health), max_health),
      last_heal_time = COALESCE(p_last_heal_time, last_heal_time),
      updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;
  RETURN FOUND;
END;$$;

CREATE OR REPLACE FUNCTION public.remove_card_instance_by_wallet(
  p_wallet_address text,
  p_card_template_id text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_deleted integer; BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_card_template_id IS NULL OR p_card_template_id = '' THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;
  DELETE FROM public.card_instances
  WHERE wallet_address = p_wallet_address AND card_template_id = p_card_template_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT; RETURN v_deleted > 0; END;$$;

CREATE OR REPLACE FUNCTION public.remove_card_instance_by_id(
  p_wallet_address text,
  p_instance_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_deleted integer; BEGIN
  IF p_wallet_address IS NULL OR p_instance_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;
  DELETE FROM public.card_instances
  WHERE id = p_instance_id AND wallet_address = p_wallet_address;
  GET DIAGNOSTICS v_deleted = ROW_COUNT; RETURN v_deleted > 0; END;$$;
