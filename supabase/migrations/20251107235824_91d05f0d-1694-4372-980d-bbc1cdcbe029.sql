
-- Добавляем отдельный индекс на wallet_address для ускорения is_admin_or_super_wallet
CREATE INDEX IF NOT EXISTS idx_user_roles_wallet_address 
ON public.user_roles(wallet_address);

-- Добавляем индекс на maintenance_mode для ускорения get_maintenance_status
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_updated_at 
ON public.maintenance_mode(updated_at DESC);

-- Комментарии для документации
COMMENT ON INDEX idx_user_roles_wallet_address IS 'Индекс для быстрой проверки ролей пользователя';
COMMENT ON INDEX idx_maintenance_mode_updated_at IS 'Индекс для быстрого получения последнего статуса техобслуживания';
