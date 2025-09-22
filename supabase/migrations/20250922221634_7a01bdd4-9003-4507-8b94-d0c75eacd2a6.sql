-- Remove the unique constraint that prevents multiple workers of the same type
ALTER TABLE public.card_instances 
DROP CONSTRAINT unique_card_instance_per_wallet;