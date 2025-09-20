-- Обновляем check constraint для card_instances, добавляя тип 'workers'
ALTER TABLE public.card_instances 
DROP CONSTRAINT card_instances_card_type_check;

ALTER TABLE public.card_instances 
ADD CONSTRAINT card_instances_card_type_check 
CHECK (card_type = ANY (ARRAY['hero'::text, 'dragon'::text, 'workers'::text]));