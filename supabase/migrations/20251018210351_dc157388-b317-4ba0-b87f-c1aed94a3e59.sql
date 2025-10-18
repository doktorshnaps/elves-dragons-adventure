-- Create mapping table for explicit card name -> class name
CREATE TABLE IF NOT EXISTS public.card_class_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('hero','dragon')),
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_wallet_address text,
  UNIQUE(card_name, card_type)
);

-- Enable RLS
ALTER TABLE public.card_class_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS card_class_mappings_select ON public.card_class_mappings;
CREATE POLICY card_class_mappings_select ON public.card_class_mappings
FOR SELECT USING (true);

DROP POLICY IF EXISTS card_class_mappings_insert ON public.card_class_mappings;
CREATE POLICY card_class_mappings_insert ON public.card_class_mappings
FOR INSERT WITH CHECK (is_admin_wallet());

DROP POLICY IF EXISTS card_class_mappings_update ON public.card_class_mappings;
CREATE POLICY card_class_mappings_update ON public.card_class_mappings
FOR UPDATE USING (is_admin_wallet());

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trg_card_class_mappings_updated_at ON public.card_class_mappings;
CREATE TRIGGER trg_card_class_mappings_updated_at
BEFORE UPDATE ON public.card_class_mappings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed mapping for common problematic hero
INSERT INTO public.card_class_mappings (card_name, card_type, class_name)
VALUES ('Верховный Стратег', 'hero', 'Стратег')
ON CONFLICT (card_name, card_type) DO NOTHING;