-- Add mgt_balance column to game_data for tracking mGT tokens
ALTER TABLE public.game_data 
ADD COLUMN IF NOT EXISTS mgt_balance NUMERIC DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.game_data.mgt_balance IS 'Balance of mGT tokens that can be claimed for real cryptocurrency';

-- Create table for tracking mGT claims history
CREATE TABLE IF NOT EXISTS public.mgt_claims (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    user_id TEXT,
    amount NUMERIC NOT NULL,
    claim_type TEXT NOT NULL DEFAULT 'box_opening', -- box_opening, withdrawal
    source_item_id TEXT, -- Reference to the item that was opened
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mgt_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for mgt_claims
CREATE POLICY "Users can view their own mgt claims" 
ON public.mgt_claims 
FOR SELECT 
USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address' OR wallet_address = auth.jwt()->>'wallet_address');

CREATE POLICY "Service role can insert mgt claims" 
ON public.mgt_claims 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mgt_claims_wallet ON public.mgt_claims(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mgt_claims_created ON public.mgt_claims(created_at DESC);