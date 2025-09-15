-- Fix security issue by adding search_path to the function
CREATE OR REPLACE FUNCTION stop_healing_without_recovery(
  p_card_instance_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Remove from medical bay without healing
  DELETE FROM medical_bay 
  WHERE card_instance_id = p_card_instance_id;
  
  -- Update card instance to remove medical bay flags
  UPDATE card_instances 
  SET 
    is_in_medical_bay = false,
    medical_bay_start_time = NULL,
    medical_bay_heal_rate = 1,
    updated_at = now()
  WHERE id = p_card_instance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';