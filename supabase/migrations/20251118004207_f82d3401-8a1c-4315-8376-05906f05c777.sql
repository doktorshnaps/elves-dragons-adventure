-- Create reward_claims table for server-side idempotency of item claims
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure unique per claim_key
CREATE UNIQUE INDEX IF NOT EXISTS reward_claims_claim_key_idx ON public.reward_claims (claim_key);

-- Enable RLS
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- Basic RLS: no public access (service role will bypass)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reward_claims' AND policyname = 'deny_all_reward_claims'
  ) THEN
    CREATE POLICY "deny_all_reward_claims" ON public.reward_claims AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);
  END IF;
END$$;