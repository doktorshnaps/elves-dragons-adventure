
-- Create table for caching verified NFT ownership
CREATE TABLE public.wallet_whitelist_nft_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT false,
  token_count INTEGER NOT NULL DEFAULT 0,
  token_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_source TEXT NOT NULL DEFAULT 'near_rpc',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, contract_id)
);

-- Enable RLS
ALTER TABLE public.wallet_whitelist_nft_access ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (game client needs to check access for any wallet)
CREATE POLICY "Anyone can read nft access records"
  ON public.wallet_whitelist_nft_access
  FOR SELECT
  USING (true);

-- Only service_role can insert/update/delete (edge function uses service role)
CREATE POLICY "Service role can insert nft access"
  ON public.wallet_whitelist_nft_access
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update nft access"
  ON public.wallet_whitelist_nft_access
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete nft access"
  ON public.wallet_whitelist_nft_access
  FOR DELETE
  TO service_role
  USING (true);

-- Indexes
CREATE INDEX idx_wallet_whitelist_nft_access_wallet ON public.wallet_whitelist_nft_access (wallet_address);
CREATE INDEX idx_wallet_whitelist_nft_access_contract ON public.wallet_whitelist_nft_access (contract_id);
CREATE INDEX idx_wallet_whitelist_nft_access_composite ON public.wallet_whitelist_nft_access (wallet_address, contract_id, has_access);

-- Updated_at trigger
CREATE TRIGGER update_wallet_whitelist_nft_access_updated_at
  BEFORE UPDATE ON public.wallet_whitelist_nft_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
