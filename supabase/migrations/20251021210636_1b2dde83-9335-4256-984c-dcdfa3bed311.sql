-- Добавляем колонку для хранения списка монстров, с которых выпадает предмет
ALTER TABLE dungeon_item_drops
ADD COLUMN IF NOT EXISTS allowed_monsters TEXT[] DEFAULT NULL;

-- Комментарий к колонке
COMMENT ON COLUMN dungeon_item_drops.allowed_monsters IS 'Список имен монстров, с которых может выпасть предмет. NULL = все монстры подземелья';

-- Обновляем триггер синхронизации для включения allowed_monsters
CREATE OR REPLACE FUNCTION public.sync_item_dungeon_drop_settings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- При добавлении/обновлении/удалении записи в dungeon_item_drops
  -- синхронизируем данные в item_templates.dungeon_drop_settings
  
  -- Получаем все активные настройки дропа для данного предмета
  UPDATE item_templates
  SET 
    dungeon_drop_settings = (
      SELECT COALESCE(json_agg(
        json_build_object(
          'dungeon_number', did.dungeon_number,
          'min_level', did.min_dungeon_level,
          'max_level', did.max_dungeon_level,
          'drop_chance', did.drop_chance,
          'is_active', did.is_active,
          'allowed_monsters', did.allowed_monsters
        )
        ORDER BY did.dungeon_number, did.min_dungeon_level
      ), '[]'::json)
      FROM dungeon_item_drops did
      WHERE did.item_template_id = 
        CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.item_template_id
          ELSE NEW.item_template_id
        END
    ),
    updated_at = now()
  WHERE id = 
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.item_template_id
      ELSE NEW.item_template_id
    END;
    
  RETURN NEW;
END;
$$;