-- Добавляем индексы для улучшения производительности

-- Индексы для таблицы game_data
CREATE INDEX IF NOT EXISTS idx_game_data_wallet_address ON public.game_data(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_data_updated_at ON public.game_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_game_data_account_level ON public.game_data(account_level);

-- Индексы для таблицы card_instances  
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_address ON public.card_instances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_card_instances_card_type ON public.card_instances(card_type);
CREATE INDEX IF NOT EXISTS idx_card_instances_template_id ON public.card_instances(card_template_id);
CREATE INDEX IF NOT EXISTS idx_card_instances_health ON public.card_instances(current_health);

-- Индексы для таблицы marketplace_listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_wallet ON public.marketplace_listings(seller_wallet_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON public.marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at);

-- Составной индекс для активных объявлений по типу и цене
CREATE INDEX IF NOT EXISTS idx_marketplace_active_by_type_price ON public.marketplace_listings(type, price) WHERE status = 'active';

-- Индексы для таблицы user_nft_cards
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_wallet_address ON public.user_nft_cards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_contract_id ON public.user_nft_cards(nft_contract_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_template_name ON public.user_nft_cards(card_template_name);

-- Добавляем версионирование для критически важных таблиц
ALTER TABLE public.game_data ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Создаем таблицу для отслеживания изменений (audit log)
CREATE TABLE IF NOT EXISTS public.data_changes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    wallet_address text,
    change_type text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data jsonb,
    new_data jsonb,
    version_from integer,
    version_to integer,
    created_at timestamp with time zone DEFAULT now(),
    created_by text
);

-- Индексы для таблицы аудита
CREATE INDEX IF NOT EXISTS idx_data_changes_table_record ON public.data_changes(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_wallet ON public.data_changes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_data_changes_created_at ON public.data_changes(created_at);

-- Включаем RLS для таблицы аудита
ALTER TABLE public.data_changes ENABLE ROW LEVEL SECURITY;

-- Политики для аудита - пользователи видят только свои изменения
CREATE POLICY "Users can view their own data changes" ON public.data_changes
FOR SELECT USING (wallet_address IS NOT NULL);

-- Функция для автоматического обновления версии
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического версионирования
DROP TRIGGER IF EXISTS game_data_version_trigger ON public.game_data;
CREATE TRIGGER game_data_version_trigger
    BEFORE UPDATE ON public.game_data
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS marketplace_version_trigger ON public.marketplace_listings;
CREATE TRIGGER marketplace_version_trigger
    BEFORE UPDATE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

-- Функция для логирования изменений
CREATE OR REPLACE FUNCTION public.log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.data_changes (
        table_name,
        record_id,
        wallet_address,
        change_type,
        old_data,
        new_data,
        version_from,
        version_to,
        created_by
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.wallet_address, OLD.wallet_address),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.version ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN NEW.version ELSE NULL END,
        current_setting('request.jwt.claims', true)::json->>'sub'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггеры для аудита критически важных таблиц
DROP TRIGGER IF EXISTS game_data_audit_trigger ON public.game_data;
CREATE TRIGGER game_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.game_data
    FOR EACH ROW
    EXECUTE FUNCTION public.log_data_changes();

DROP TRIGGER IF EXISTS marketplace_audit_trigger ON public.marketplace_listings;
CREATE TRIGGER marketplace_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_data_changes();

-- Создаем материализованное представление для быстрого доступа к статистике
CREATE MATERIALIZED VIEW IF NOT EXISTS public.marketplace_stats AS
SELECT 
    type,
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE status = 'active') as active_listings,
    AVG(price) FILTER (WHERE status = 'active') as avg_price,
    MIN(price) FILTER (WHERE status = 'active') as min_price,
    MAX(price) FILTER (WHERE status = 'active') as max_price,
    COUNT(*) FILTER (WHERE status = 'sold' AND sold_at > now() - interval '24 hours') as sold_today
FROM public.marketplace_listings
GROUP BY type;

-- Индекс для материализованного представления
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_stats_type ON public.marketplace_stats(type);

-- Функция для обновления статистики
CREATE OR REPLACE FUNCTION public.refresh_marketplace_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.marketplace_stats;
END;
$$ LANGUAGE plpgsql;

-- Добавляем нормализованную таблицу для типов карт
CREATE TABLE IF NOT EXISTS public.card_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    category text NOT NULL, -- 'hero', 'dragon', 'spell', etc.
    rarity text NOT NULL DEFAULT 'common',
    base_stats jsonb DEFAULT '{}',
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Включаем RLS для типов карт
ALTER TABLE public.card_types ENABLE ROW LEVEL SECURITY;

-- Политика - все могут читать типы карт
CREATE POLICY "Anyone can view card types" ON public.card_types
FOR SELECT USING (true);

-- Добавляем связь card_instances с card_types
ALTER TABLE public.card_instances ADD COLUMN IF NOT EXISTS card_type_id uuid REFERENCES public.card_types(id);

-- Создаем индекс для новой связи
CREATE INDEX IF NOT EXISTS idx_card_instances_type_id ON public.card_instances(card_type_id);

-- Функция для разрешения конфликтов версий
CREATE OR REPLACE FUNCTION public.resolve_version_conflict(
    p_table_name text,
    p_record_id uuid,
    p_expected_version integer,
    p_new_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    current_version integer;
    current_data jsonb;
    merged_data jsonb;
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
        FOR key IN SELECT jsonb_object_keys(p_new_data)
        LOOP
            merged_data = jsonb_set(merged_data, ARRAY[key], p_new_data->key);
        END LOOP;
        
        RETURN merged_data;
    END IF;
END;
$$ LANGUAGE plpgsql;