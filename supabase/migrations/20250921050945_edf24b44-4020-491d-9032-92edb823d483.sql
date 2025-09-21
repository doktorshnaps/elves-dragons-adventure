-- Allow multiple worker instances per wallet and template
ALTER TABLE public.card_instances
  DROP CONSTRAINT IF EXISTS uq_card_instances_wallet_template;

-- Add a non-unique index for performance (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_template
  ON public.card_instances(wallet_address, card_template_id);