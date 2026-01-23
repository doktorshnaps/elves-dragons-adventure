-- Drop the incorrect unique index that prevents multiple cards of the same template
-- A player CAN and SHOULD be able to have multiple cards of the same template
DROP INDEX IF EXISTS public.uniq_card_instances_wallet_template;