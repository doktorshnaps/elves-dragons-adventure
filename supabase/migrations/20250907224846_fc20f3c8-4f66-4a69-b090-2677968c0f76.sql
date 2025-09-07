-- Исправляем функцию версионирования с безопасным search_path
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Функция для разрешения конфликтов версий с исправленным циклом
CREATE OR REPLACE FUNCTION public.resolve_version_conflict(
    p_table_name text,
    p_record_id uuid,
    p_expected_version integer,
    p_new_data jsonb
)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_version integer;
    current_data jsonb;
    merged_data jsonb;
    key_name text;
BEGIN
    -- Получаем текущую версию
    EXECUTE format('SELECT version, to_jsonb(%I) FROM %I WHERE id = $1', p_table_name, p_table_name)
    INTO current_version, current_data
    USING p_record_id;
    
    IF current_version IS NULL THEN
        RAISE EXCEPTION 'Record not found';
    END IF;
    
    IF current_version = p_expected_version THEN
        -- Нет конфликта, можно обновлять
        RETURN p_new_data;
    ELSE
        -- Есть конфликт, пытаемся объединить изменения
        merged_data = current_data;
        
        -- Простая стратегия merge - берем новые значения, если они отличаются
        FOR key_name IN SELECT jsonb_object_keys(p_new_data)
        LOOP
            merged_data = jsonb_set(merged_data, ARRAY[key_name], p_new_data->key_name);
        END LOOP;
        
        RETURN merged_data;
    END IF;
END;
$$;