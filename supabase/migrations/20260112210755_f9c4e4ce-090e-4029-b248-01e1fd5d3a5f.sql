
-- =====================================================
-- FIX: treasure_hunt_findings - убираем все старые политики и создаём правильные
-- =====================================================

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Anyone can insert treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Anyone can update treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Anyone can view treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Users can view all findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Public can view treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role only for INSERT" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role only for UPDATE" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Users can view their own findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role can insert findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role can update findings" ON public.treasure_hunt_findings;

-- SELECT: authenticated пользователи видят свои находки
CREATE POLICY "treasure_hunt_findings_select_own"
ON public.treasure_hunt_findings
FOR SELECT
TO authenticated
USING (wallet_address = public.get_current_user_wallet());

-- SELECT: service_role видит все
CREATE POLICY "treasure_hunt_findings_select_service"
ON public.treasure_hunt_findings
FOR SELECT
TO service_role
USING (true);

-- INSERT: только service_role (через edge functions)
CREATE POLICY "treasure_hunt_findings_insert_service"
ON public.treasure_hunt_findings
FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE: только service_role
CREATE POLICY "treasure_hunt_findings_update_service"
ON public.treasure_hunt_findings
FOR UPDATE
TO service_role
USING (true);

-- =====================================================
-- FIX: mgt_claims - INSERT должен быть только для service_role
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert mgt claims" ON public.mgt_claims;
DROP POLICY IF EXISTS "mgt_claims_insert_policy" ON public.mgt_claims;

-- INSERT: только service_role
CREATE POLICY "mgt_claims_insert_service"
ON public.mgt_claims
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- FIX: security_audit_log - INSERT должен быть только для service_role
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert audit log" ON public.security_audit_log;
DROP POLICY IF EXISTS "security_audit_log_insert_policy" ON public.security_audit_log;

-- INSERT: только service_role
CREATE POLICY "security_audit_log_insert_service"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- FIX: referral_earnings - дублирующиеся политики
-- =====================================================

DROP POLICY IF EXISTS "Service role only for referral earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Service role only insert" ON public.referral_earnings;
DROP POLICY IF EXISTS "referral_earnings_insert_policy" ON public.referral_earnings;

-- INSERT: только service_role
CREATE POLICY "referral_earnings_insert_service"
ON public.referral_earnings
FOR INSERT
TO service_role
WITH CHECK (true);
