CREATE OR REPLACE FUNCTION public.remove_card_from_teams_on_bay_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet TEXT;
  v_card_id UUID;
  v_team RECORD;
  v_pair JSONB;
  v_updated_pair JSONB;
  v_result JSONB;
BEGIN
  v_card_id := NEW.card_instance_id;
  v_wallet := NEW.wallet_address;
  IF v_wallet IS NULL THEN
    SELECT wallet_address INTO v_wallet FROM public.card_instances WHERE id = v_card_id;
  END IF;
  IF v_wallet IS NULL OR v_card_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_team IN
    SELECT id, team_data FROM public.player_teams WHERE wallet_address = v_wallet
  LOOP
    v_result := '[]'::jsonb;
    FOR v_pair IN SELECT * FROM jsonb_array_elements(COALESCE(v_team.team_data, '[]'::jsonb))
    LOOP
      IF (v_pair->'hero'->>'id') = v_card_id::text
         OR (v_pair->'hero'->>'instanceId') = v_card_id::text
         OR (v_pair->'hero'->>'card_instance_id') = v_card_id::text
      THEN
        v_updated_pair := jsonb_build_object('hero', NULL, 'dragon', NULL);
      ELSIF (v_pair->'dragon'->>'id') = v_card_id::text
         OR (v_pair->'dragon'->>'instanceId') = v_card_id::text
         OR (v_pair->'dragon'->>'card_instance_id') = v_card_id::text
      THEN
        v_updated_pair := jsonb_set(v_pair, '{dragon}', 'null'::jsonb);
      ELSE
        v_updated_pair := v_pair;
      END IF;
      v_result := v_result || jsonb_build_array(v_updated_pair);
    END LOOP;

    IF v_result IS DISTINCT FROM v_team.team_data THEN
      UPDATE public.player_teams
      SET team_data = v_result, updated_at = now()
      WHERE id = v_team.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medical_bay_remove_from_teams ON public.medical_bay;
DROP TRIGGER IF EXISTS trg_forge_bay_remove_from_teams ON public.forge_bay;

CREATE TRIGGER trg_medical_bay_remove_from_teams
AFTER INSERT ON public.medical_bay
FOR EACH ROW EXECUTE FUNCTION public.remove_card_from_teams_on_bay_insert();

CREATE TRIGGER trg_forge_bay_remove_from_teams
AFTER INSERT ON public.forge_bay
FOR EACH ROW EXECUTE FUNCTION public.remove_card_from_teams_on_bay_insert();