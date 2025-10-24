-- Create item_instances table for per-instance inventory tracking
-- Function to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table: item_instances
CREATE TABLE IF NOT EXISTS public.item_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address TEXT NOT NULL,
  template_id INTEGER REFERENCES public.item_templates(id) ON DELETE SET NULL,
  item_id TEXT,
  name TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger
DROP TRIGGER IF EXISTS trg_item_instances_updated_at ON public.item_instances;
CREATE TRIGGER trg_item_instances_updated_at
BEFORE UPDATE ON public.item_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.item_instances ENABLE ROW LEVEL SECURITY;

-- Policies: owner-only access (by user_id or wallet_address)
DROP POLICY IF EXISTS item_instances_select_policy ON public.item_instances;
CREATE POLICY item_instances_select_policy
ON public.item_instances
FOR SELECT
USING ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((user_id = ( SELECT auth.uid() AS uid)) OR (wallet_address = get_current_user_wallet())));

DROP POLICY IF EXISTS item_instances_insert_policy ON public.item_instances;
CREATE POLICY item_instances_insert_policy
ON public.item_instances
FOR INSERT
WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((user_id = ( SELECT auth.uid() AS uid)) OR (wallet_address = get_current_user_wallet())));

DROP POLICY IF EXISTS item_instances_update_policy ON public.item_instances;
CREATE POLICY item_instances_update_policy
ON public.item_instances
FOR UPDATE
USING ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((user_id = ( SELECT auth.uid() AS uid)) OR (wallet_address = get_current_user_wallet())));

DROP POLICY IF EXISTS item_instances_delete_policy ON public.item_instances;
CREATE POLICY item_instances_delete_policy
ON public.item_instances
FOR DELETE
USING ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((user_id = ( SELECT auth.uid() AS uid)) OR (wallet_address = get_current_user_wallet())));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_item_instances_wallet ON public.item_instances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_item_instances_item_id ON public.item_instances(item_id);
CREATE INDEX IF NOT EXISTS idx_item_instances_template_id ON public.item_instances(template_id);

-- One-time backfill from existing game_data.inventory JSON
-- We try to map by name to item_templates; fallback keeps provided name/type
WITH inv AS (
  SELECT 
    gd.user_id,
    gd.wallet_address,
    jsonb_array_elements(gd.inventory) AS elem
  FROM public.game_data gd
  WHERE gd.inventory IS NOT NULL AND jsonb_typeof(gd.inventory) = 'array'
)
INSERT INTO public.item_instances (user_id, wallet_address, template_id, item_id, name, type)
SELECT 
  inv.user_id,
  COALESCE(inv.wallet_address, get_current_user_wallet()),
  it.id AS template_id,
  it.item_id,
  COALESCE((inv.elem->>'name'), it.name) AS name,
  COALESCE((inv.elem->>'type'), it.type, 'material') AS type
FROM inv
LEFT JOIN public.item_templates it 
  ON (lower(it.name) = lower(inv.elem->>'name'))
ON CONFLICT DO NOTHING;