-- ===================================================
-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ДУБЛИРУЮЩИХ RLS ПОЛИТИК
-- ===================================================
-- Заменяем политики FOR ALL на отдельные политики для INSERT/UPDATE/DELETE
-- чтобы избежать конфликтов с политиками FOR SELECT
-- ===================================================

-- ===================================================
-- ЧАСТЬ 1: MAINTENANCE_MODE
-- ===================================================

-- Удаляем политику FOR ALL
DROP POLICY IF EXISTS "maintenance_mode_modify_policy" ON public.maintenance_mode;

-- Создаём отдельные политики для INSERT, UPDATE, DELETE
CREATE POLICY "maintenance_mode_insert_policy"
ON public.maintenance_mode
FOR INSERT
WITH CHECK (
  (enabled_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

CREATE POLICY "maintenance_mode_update_policy"
ON public.maintenance_mode
FOR UPDATE
USING (
  (enabled_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

CREATE POLICY "maintenance_mode_delete_policy"
ON public.maintenance_mode
FOR DELETE
USING (
  (enabled_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

-- ===================================================
-- ЧАСТЬ 2: QUESTS
-- ===================================================

-- Удаляем политику FOR ALL
DROP POLICY IF EXISTS "quests_modify_policy" ON public.quests;

-- Создаём отдельные политики для INSERT, UPDATE, DELETE
CREATE POLICY "quests_insert_policy"
ON public.quests
FOR INSERT
WITH CHECK (is_quest_admin());

CREATE POLICY "quests_update_policy"
ON public.quests
FOR UPDATE
USING (is_quest_admin());

CREATE POLICY "quests_delete_policy"
ON public.quests
FOR DELETE
USING (is_quest_admin());

-- ===================================================
-- ЧАСТЬ 3: USER_ROLES
-- ===================================================

-- Удаляем политику FOR ALL
DROP POLICY IF EXISTS "user_roles_modify_policy" ON public.user_roles;

-- Создаём отдельные политики для INSERT, UPDATE, DELETE
CREATE POLICY "user_roles_insert_policy"
ON public.user_roles
FOR INSERT
WITH CHECK (
  (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

CREATE POLICY "user_roles_update_policy"
ON public.user_roles
FOR UPDATE
USING (
  (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

CREATE POLICY "user_roles_delete_policy"
ON public.user_roles
FOR DELETE
USING (
  (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

-- ===================================================
-- ЧАСТЬ 4: WHITELIST_CONTRACTS
-- ===================================================

-- Удаляем политику FOR ALL
DROP POLICY IF EXISTS "whitelist_contracts_modify_policy" ON public.whitelist_contracts;

-- Создаём отдельные политики для INSERT, UPDATE, DELETE
CREATE POLICY "whitelist_contracts_insert_policy"
ON public.whitelist_contracts
FOR INSERT
WITH CHECK (
  (added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

CREATE POLICY "whitelist_contracts_update_policy"
ON public.whitelist_contracts
FOR UPDATE
USING (
  (added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

CREATE POLICY "whitelist_contracts_delete_policy"
ON public.whitelist_contracts
FOR DELETE
USING (
  (added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);