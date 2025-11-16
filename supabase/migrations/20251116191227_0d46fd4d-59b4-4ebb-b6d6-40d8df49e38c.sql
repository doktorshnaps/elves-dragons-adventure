-- Update all card image paths from .png to .webp in game_data table
-- This migration updates the cards JSON field for all users

DO $$ 
DECLARE
    game_record RECORD;
    updated_cards JSONB;
    card JSONB;
BEGIN
    FOR game_record IN SELECT id, cards FROM game_data
    LOOP
        -- Initialize updated_cards as an empty array
        updated_cards := '[]'::jsonb;
        
        -- Loop through each card in the cards array
        FOR card IN SELECT * FROM jsonb_array_elements(game_record.cards)
        LOOP
            -- Update the image path if it contains .png
            IF card->>'image' LIKE '%/lovable-uploads/%.png' THEN
                card := jsonb_set(
                    card,
                    '{image}',
                    to_jsonb(replace(card->>'image', '.png', '.webp'))
                );
            END IF;
            
            -- Add the updated card to the array
            updated_cards := updated_cards || jsonb_build_array(card);
        END LOOP;
        
        -- Update the game_data record with the new cards array
        UPDATE game_data 
        SET cards = updated_cards,
            updated_at = now()
        WHERE id = game_record.id;
    END LOOP;
END $$;