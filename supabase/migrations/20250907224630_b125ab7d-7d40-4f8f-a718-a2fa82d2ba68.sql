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