-- ===================================================
-- ИСПРАВЛЕНИЕ ДУБЛИРУЮЩИХ RLS ПОЛИТИК И ИНДЕКСОВ
-- ===================================================
-- Эта миграция исправляет оставшиеся проблемы производительности:
-- 1. Объединяет дублирующие RLS политики для SELECT
-- 2. Удаляет дублирующие индексы
-- ===================================================

-- ===================================================
-- ЧАСТЬ 1: ИСПРАВЛЕНИЕ MAINTENANCE_MODE
-- ===================================================

-- Удаляем обе политики
DROP POLICY IF EXISTS "maintenance_mode_select_policy" ON public.maintenance_mode;
DROP POLICY IF EXISTS "maintenance_mode_all_policy" ON public.maintenance_mode;

-- Создаём единую оптимизированную политику для SELECT
CREATE POLICY "maintenance_mode_unified_select_policy"
ON public.maintenance_mode
FOR SELECT
USING (true);

-- Создаём политику для остальных операций (INSERT, UPDATE, DELETE)
CREATE POLICY "maintenance_mode_modify_policy"
ON public.maintenance_mode
FOR ALL
USING (
  (enabled_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

-- ===================================================
-- ЧАСТЬ 2: ИСПРАВЛЕНИЕ QUESTS
-- ===================================================

-- Удаляем обе политики
DROP POLICY IF EXISTS "quests_select_policy" ON public.quests;
DROP POLICY IF EXISTS "quests_all_policy" ON public.quests;

-- Создаём единую оптимизированную политику для SELECT
CREATE POLICY "quests_unified_select_policy"
ON public.quests
FOR SELECT
USING (
  is_active = true OR is_quest_admin()
);

-- Создаём политику для остальных операций (INSERT, UPDATE, DELETE)
CREATE POLICY "quests_modify_policy"
ON public.quests
FOR ALL
USING (is_quest_admin())
WITH CHECK (is_quest_admin());

-- ===================================================
-- ЧАСТЬ 3: ИСПРАВЛЕНИЕ USER_ROLES
-- ===================================================

-- Удаляем обе политики
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_all_policy" ON public.user_roles;

-- Создаём единую оптимизированную политику для SELECT
CREATE POLICY "user_roles_unified_select_policy"
ON public.user_roles
FOR SELECT
USING (
  wallet_address = get_current_user_wallet()
  OR (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

-- Создаём политику для остальных операций (INSERT, UPDATE, DELETE)
CREATE POLICY "user_roles_modify_policy"
ON public.user_roles
FOR ALL
USING (
  (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

-- ===================================================
-- ЧАСТЬ 4: ИСПРАВЛЕНИЕ WHITELIST_CONTRACTS
-- ===================================================

-- Удаляем обе политики
DROP POLICY IF EXISTS "whitelist_contracts_select_policy" ON public.whitelist_contracts;
DROP POLICY IF EXISTS "whitelist_contracts_all_policy" ON public.whitelist_contracts;

-- Создаём единую оптимизированную политику для SELECT
CREATE POLICY "whitelist_contracts_unified_select_policy"
ON public.whitelist_contracts
FOR SELECT
USING (
  is_active = true 
  OR ((added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet())
);

-- Создаём политику для остальных операций (INSERT, UPDATE, DELETE)
CREATE POLICY "whitelist_contracts_modify_policy"
ON public.whitelist_contracts
FOR ALL
USING (
  (added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

-- ===================================================
-- ЧАСТЬ 5: УДАЛЕНИЕ ДУБЛИРУЮЩИХ ИНДЕКСОВ
-- ===================================================

-- Удаляем дублирующий индекс для game_data
-- Оставляем game_data_wallet_address_unique (он обеспечивает уникальность)
DROP INDEX IF EXISTS public.ux_game_data_wallet_address;

-- Удаляем дублирующий индекс для referrals
-- Оставляем referrals_referred_wallet_address_key (он создан автоматически как часть UNIQUE constraint)
DROP INDEX IF EXISTS public.referrals_unique_referred_wallet;

-- ===================================================
-- ЧАСТЬ 6: ОБНОВЛЕНИЕ СТАТИСТИКИ
-- ===================================================

-- Обновляем статистику для оптимального планирования запросов
ANALYZE public.maintenance_mode;
ANALYZE public.quests;
ANALYZE public.user_roles;
ANALYZE public.whitelist_contracts;
ANALYZE public.game_data;
ANALYZE public.referrals;