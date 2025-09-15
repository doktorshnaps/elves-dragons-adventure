-- Update place_card_in_medical_bay to remove card from selected_team
CREATE OR REPLACE FUNCTION public.place_card_in_medical_bay(p_card_instance_id uuid, p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_card_instance RECORD;
    v_game_data RECORD;
    v_heal_time_hours NUMERIC;
    v_estimated_completion TIMESTAMPTZ;
    v_user_id uuid;
    v_selected_team jsonb;
    v_updated_team jsonb;
    v_card_template_id text;
    v_result jsonb;
BEGIN
    -- Get card instance information
    SELECT * INTO v_card_instance
    FROM public.card_instances 
    WHERE id = p_card_instance_id 
      AND wallet_address = p_wallet_address;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card instance not found';
    END IF;
    
    -- Check if card is already in medical bay
    IF EXISTS (
        SELECT 1 FROM public.medical_bay 
        WHERE card_instance_id = p_card_instance_id 
          AND is_completed = false
    ) THEN
        RAISE EXCEPTION 'Card is already in medical bay';
    END IF;
    
    -- Check if medical bay is full (max 3 slots)
    IF (
        SELECT COUNT(*) 
        FROM public.medical_bay 
        WHERE wallet_address = p_wallet_address 
          AND is_completed = false
    ) >= 3 THEN
        RAISE EXCEPTION 'Medical bay is full (max 3 cards)';
    END IF;
    
    -- Get game data and user_id
    SELECT * INTO v_game_data
    FROM public.game_data 
    WHERE wallet_address = p_wallet_address;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game data not found';
    END IF;
    
    v_user_id := v_game_data.user_id;
    v_card_template_id := v_card_instance.card_template_id;
    
    -- Calculate healing time (10 HP per minute)
    v_heal_time_hours := (v_card_instance.max_health - v_card_instance.current_health) / 10.0 / 60.0;
    v_estimated_completion := now() + (v_heal_time_hours || ' hours')::interval;
    
    -- Remove card from selected_team if present
    v_selected_team := COALESCE(v_game_data.selected_team, '[]'::jsonb);
    
    -- Filter out the card from selected_team by checking both hero and dragon slots
    v_updated_team := (
        SELECT jsonb_agg(team_slot)
        FROM jsonb_array_elements(v_selected_team) AS team_slot
        WHERE NOT (
            (team_slot->'hero'->>'id' = v_card_template_id) OR 
            (team_slot->'dragon'->>'id' = v_card_template_id)
        )
    );
    
    -- If no valid slots remain after filtering, set to empty array
    v_updated_team := COALESCE(v_updated_team, '[]'::jsonb);
    
    -- Update game_data to remove card from selected_team
    UPDATE public.game_data
    SET selected_team = v_updated_team,
        updated_at = now()
    WHERE wallet_address = p_wallet_address;
    
    -- Update card instance
    UPDATE public.card_instances
    SET 
        is_in_medical_bay = true,
        medical_bay_start_time = now(),
        medical_bay_heal_rate = 10,
        updated_at = now()
    WHERE id = p_card_instance_id;
    
    -- Insert into medical bay
    INSERT INTO public.medical_bay (
        card_instance_id,
        user_id,
        wallet_address,
        placed_at,
        estimated_completion,
        heal_rate,
        is_completed
    ) VALUES (
        p_card_instance_id,
        v_user_id,
        p_wallet_address,
        now(),
        v_estimated_completion,
        10,
        false
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'estimated_completion', v_estimated_completion,
        'heal_rate', 10,
        'removed_from_team', (jsonb_array_length(v_selected_team) > jsonb_array_length(v_updated_team))
    );
    
    RETURN v_result;
END;
$$;