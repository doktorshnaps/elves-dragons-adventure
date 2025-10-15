-- ===================================================
-- ОПТИМИЗАЦИЯ RLS ПОЛИТИК ДЛЯ ПОВЫШЕНИЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ===================================================
-- Эта миграция исправляет проблемы производительности RLS:
-- 1. Заменяет auth.<function>() на (select auth.<function>())
-- 2. Объединяет множественные разрешающие политики
-- 3. Удаляет дублирующиеся индексы
-- ===================================================

-- ===================================================
-- ЧАСТЬ 1: ОПТИМИЗАЦИЯ MARKETPLACE_LISTINGS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Buyers can mark listing as purchased" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Buyers can view their purchased listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers can view their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;

-- Создаем оптимизированные политики для marketplace_listings
CREATE POLICY "marketplace_listings_select_policy"
ON public.marketplace_listings
FOR SELECT
USING (
  status = 'active'
  OR ((select auth.uid()) IS NOT NULL AND buyer_wallet_address = get_current_user_wallet())
  OR ((select auth.uid()) IS NOT NULL AND seller_wallet_address = get_current_user_wallet())
);

CREATE POLICY "marketplace_listings_insert_policy"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND seller_wallet_address = get_current_user_wallet()
);

CREATE POLICY "marketplace_listings_update_policy"
ON public.marketplace_listings
FOR UPDATE
USING (
  ((select auth.uid()) IS NOT NULL AND status = 'active' AND buyer_wallet_address = get_current_user_wallet())
  OR ((select auth.uid()) IS NOT NULL AND seller_wallet_address = get_current_user_wallet())
);

-- ===================================================
-- ЧАСТЬ 2: ОПТИМИЗАЦИЯ CARD_INSTANCES
-- ===================================================

-- Удаляем старые дублирующие политики
DROP POLICY IF EXISTS "Users can create their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can insert their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can delete their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can update their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can view their own card instances" ON public.card_instances;

-- Создаем оптимизированные политики для card_instances
CREATE POLICY "card_instances_select_policy"
ON public.card_instances
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "card_instances_insert_policy"
ON public.card_instances
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "card_instances_update_policy"
ON public.card_instances
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "card_instances_delete_policy"
ON public.card_instances
FOR DELETE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

-- ===================================================
-- ЧАСТЬ 3: ОПТИМИЗАЦИЯ GAME_DATA
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can insert their own game data" ON public.game_data;
DROP POLICY IF EXISTS "allow_wallet_create_game_data" ON public.game_data;
DROP POLICY IF EXISTS "Users can update their own game data" ON public.game_data;
DROP POLICY IF EXISTS "Users can view their own game data" ON public.game_data;

-- Создаем оптимизированные политики для game_data
CREATE POLICY "game_data_select_policy"
ON public.game_data
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "game_data_insert_policy"
ON public.game_data
FOR INSERT
WITH CHECK (
  (wallet_address IS NOT NULL AND length(trim(wallet_address)) > 0)
  OR ((select auth.uid()) IS NOT NULL AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet())))
);

CREATE POLICY "game_data_update_policy"
ON public.game_data
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

-- ===================================================
-- ЧАСТЬ 4: ОПТИМИЗАЦИЯ MEDICAL_BAY
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can delete their own medical bay entries" ON public.medical_bay;
DROP POLICY IF EXISTS "Users can insert their own medical bay entries" ON public.medical_bay;
DROP POLICY IF EXISTS "Users can update their own medical bay entries" ON public.medical_bay;
DROP POLICY IF EXISTS "Users can view their own medical bay entries" ON public.medical_bay;

-- Создаем оптимизированные политики для medical_bay
CREATE POLICY "medical_bay_select_policy"
ON public.medical_bay
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "medical_bay_insert_policy"
ON public.medical_bay
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "medical_bay_update_policy"
ON public.medical_bay
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

CREATE POLICY "medical_bay_delete_policy"
ON public.medical_bay
FOR DELETE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((user_id = (select auth.uid())) OR (wallet_address = get_current_user_wallet()))
);

-- ===================================================
-- ЧАСТЬ 5: ОПТИМИЗАЦИЯ USER_NFT_CARDS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can delete their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can insert their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can update their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can view their own NFT cards" ON public.user_nft_cards;

-- Создаем оптимизированные политики для user_nft_cards
CREATE POLICY "user_nft_cards_select_policy"
ON public.user_nft_cards
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

CREATE POLICY "user_nft_cards_insert_policy"
ON public.user_nft_cards
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

CREATE POLICY "user_nft_cards_update_policy"
ON public.user_nft_cards
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

CREATE POLICY "user_nft_cards_delete_policy"
ON public.user_nft_cards
FOR DELETE
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

-- ===================================================
-- ЧАСТЬ 6: ОПТИМИЗАЦИЯ REFERRALS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;

-- Создаем оптимизированные политики для referrals
CREATE POLICY "referrals_select_policy"
ON public.referrals
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((referrer_wallet_address = get_current_user_wallet()) OR (referred_wallet_address = get_current_user_wallet()))
);

CREATE POLICY "referrals_insert_policy"
ON public.referrals
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND referrer_wallet_address = get_current_user_wallet()
);

CREATE POLICY "referrals_update_policy"
ON public.referrals
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND referrer_wallet_address = get_current_user_wallet()
);

-- ===================================================
-- ЧАСТЬ 7: ОПТИМИЗАЦИЯ DATA_CHANGES
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view their own data changes" ON public.data_changes;

-- Создаем оптимизированную политику
CREATE POLICY "data_changes_select_policy"
ON public.data_changes
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

-- ===================================================
-- ЧАСТЬ 8: ОПТИМИЗАЦИЯ PROFILES
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Создаем оптимизированные политики для profiles
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
USING (
  (select auth.uid()) = user_id
);

CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
);

CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (
  (select auth.uid()) = user_id
);

-- ===================================================
-- ЧАСТЬ 9: ОПТИМИЗАЦИЯ USER_QUEST_PROGRESS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can insert their own quest progress" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Users can update their own quest progress" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Users can view their own quest progress" ON public.user_quest_progress;

-- Создаем оптимизированные политики для user_quest_progress
CREATE POLICY "user_quest_progress_select_policy"
ON public.user_quest_progress
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((wallet_address = get_current_user_wallet()) OR (user_id = (select auth.uid())))
);

CREATE POLICY "user_quest_progress_insert_policy"
ON public.user_quest_progress
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND ((wallet_address = get_current_user_wallet()) OR (user_id = (select auth.uid())))
);

CREATE POLICY "user_quest_progress_update_policy"
ON public.user_quest_progress
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND ((wallet_address = get_current_user_wallet()) OR (user_id = (select auth.uid())))
);

-- ===================================================
-- ЧАСТЬ 10: ОПТИМИЗАЦИЯ WALLET_IDENTITIES
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can insert their own wallet identities" ON public.wallet_identities;
DROP POLICY IF EXISTS "Users can update their own wallet identities" ON public.wallet_identities;
DROP POLICY IF EXISTS "Users can view their own wallet identities" ON public.wallet_identities;

-- Создаем оптимизированные политики для wallet_identities
CREATE POLICY "wallet_identities_select_policy"
ON public.wallet_identities
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

CREATE POLICY "wallet_identities_insert_policy"
ON public.wallet_identities
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

CREATE POLICY "wallet_identities_update_policy"
ON public.wallet_identities
FOR UPDATE
USING (
  (select auth.uid()) IS NOT NULL 
  AND wallet_address = get_current_user_wallet()
);

-- ===================================================
-- ЧАСТЬ 11: ОПТИМИЗАЦИЯ REFERRAL_EARNINGS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view their own referral earnings" ON public.referral_earnings;

-- Создаем оптимизированную политику
CREATE POLICY "referral_earnings_select_policy"
ON public.referral_earnings
FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL 
  AND referrer_wallet_address = get_current_user_wallet()
);

-- ===================================================
-- ЧАСТЬ 12: ОПТИМИЗАЦИЯ MAINTENANCE_MODE
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Anyone can view maintenance status" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Only admin can manage maintenance mode" ON public.maintenance_mode;

-- Создаем оптимизированные политики для maintenance_mode
CREATE POLICY "maintenance_mode_select_policy"
ON public.maintenance_mode
FOR SELECT
USING (true);

CREATE POLICY "maintenance_mode_all_policy"
ON public.maintenance_mode
FOR ALL
USING (
  (enabled_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);

-- ===================================================
-- ЧАСТЬ 13: ОПТИМИЗАЦИЯ QUESTS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Admins can manage quests" ON public.quests;
DROP POLICY IF EXISTS "Anyone can view active quests" ON public.quests;

-- Создаем оптимизированные политики для quests
CREATE POLICY "quests_select_policy"
ON public.quests
FOR SELECT
USING (
  is_active = true OR is_quest_admin()
);

CREATE POLICY "quests_all_policy"
ON public.quests
FOR ALL
USING (is_quest_admin())
WITH CHECK (is_quest_admin());

-- ===================================================
-- ЧАСТЬ 14: ОПТИМИЗАЦИЯ USER_ROLES
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Создаем оптимизированные политики для user_roles
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
USING (
  wallet_address = get_current_user_wallet()
  OR (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

CREATE POLICY "user_roles_all_policy"
ON public.user_roles
FOR ALL
USING (
  (get_current_user_wallet() = 'mr_bruts.tg')
  OR has_role(get_current_user_wallet(), 'super_admin'::app_role)
);

-- ===================================================
-- ЧАСТЬ 15: ОПТИМИЗАЦИЯ WHITELIST
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Admins can view all whitelist entries" ON public.whitelist;
DROP POLICY IF EXISTS "Anyone can check if they are whitelisted" ON public.whitelist;

-- Создаем оптимизированные политики для whitelist
CREATE POLICY "whitelist_select_policy"
ON public.whitelist
FOR SELECT
USING (
  ((wallet_address = get_current_user_wallet()) AND (is_active = true))
  OR ((added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet())
);

-- ===================================================
-- ЧАСТЬ 16: ОПТИМИЗАЦИЯ WHITELIST_CONTRACTS
-- ===================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Admins can manage whitelist contracts" ON public.whitelist_contracts;
DROP POLICY IF EXISTS "Anyone can read active whitelist contracts" ON public.whitelist_contracts;

-- Создаем оптимизированные политики для whitelist_contracts
CREATE POLICY "whitelist_contracts_select_policy"
ON public.whitelist_contracts
FOR SELECT
USING (
  is_active = true 
  OR ((added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet())
);

CREATE POLICY "whitelist_contracts_all_policy"
ON public.whitelist_contracts
FOR ALL
USING (
  (added_by_wallet_address = 'mr_bruts.tg') OR is_admin_wallet()
);