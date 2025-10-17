-- Add unique constraint for upsert on card_images
DO $$ BEGIN
  -- Create unique index on the composite key used by upsert
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'ux_card_images_card_key'
  ) THEN
    CREATE UNIQUE INDEX ux_card_images_card_key
    ON public.card_images (card_name, card_type, rarity, faction);
  END IF;
END $$;