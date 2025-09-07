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