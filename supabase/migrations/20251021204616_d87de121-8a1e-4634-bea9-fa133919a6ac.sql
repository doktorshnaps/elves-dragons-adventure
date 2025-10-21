-- Добавляем столбец для настроек дропа предметов по подземельям и уровням
ALTER TABLE public.item_templates 
ADD COLUMN IF NOT EXISTS dungeon_drop_settings jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.item_templates.dungeon_drop_settings IS 'Массив настроек дропа: [{dungeon_number: 1, dungeon_type: "spider-nest", min_level: 1, max_level: 10, drop_chance: 5.0}]';

-- Функция для синхронизации dungeon_drop_settings при изменении dungeon_item_drops
CREATE OR REPLACE FUNCTION sync_item_dungeon_drop_settings()
RETURNS TRIGGER AS $$
DECLARE
  v_drop_settings jsonb;
BEGIN
  -- Собираем все активные настройки дропа для данного item_template_id
  SELECT jsonb_agg(
    jsonb_build_object(
      'dungeon_number', did.dungeon_number,
      'min_level', did.min_dungeon_level,
      'max_level', did.max_dungeon_level,
      'drop_chance', did.drop_chance,
      'is_active', did.is_active
    )
  )
  INTO v_drop_settings
  FROM public.dungeon_item_drops did
  WHERE did.item_template_id = COALESCE(NEW.item_template_id, OLD.item_template_id)
    AND did.is_active = true;

  -- Обновляем dungeon_drop_settings в item_templates
  UPDATE public.item_templates
  SET 
    dungeon_drop_settings = COALESCE(v_drop_settings, '[]'::jsonb),
    updated_at = now()
  WHERE id = COALESCE(NEW.item_template_id, OLD.item_template_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматической синхронизации при изменении dungeon_item_drops
DROP TRIGGER IF EXISTS trigger_sync_item_dungeon_drop_settings ON public.dungeon_item_drops;
CREATE TRIGGER trigger_sync_item_dungeon_drop_settings
AFTER INSERT OR UPDATE OR DELETE ON public.dungeon_item_drops
FOR EACH ROW
EXECUTE FUNCTION sync_item_dungeon_drop_settings();

-- Начальная синхронизация существующих данных
UPDATE public.item_templates it
SET dungeon_drop_settings = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'dungeon_number', did.dungeon_number,
      'min_level', did.min_dungeon_level,
      'max_level', did.max_dungeon_level,
      'drop_chance', did.drop_chance,
      'is_active', did.is_active
    )
  ), '[]'::jsonb)
  FROM public.dungeon_item_drops did
  WHERE did.item_template_id = it.id
    AND did.is_active = true
);