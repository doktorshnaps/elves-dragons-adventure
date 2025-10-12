-- Create soul_donations table for tracking player donations
CREATE TABLE public.soul_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_soul_donations_wallet ON public.soul_donations(wallet_address);
CREATE INDEX idx_soul_donations_created_at ON public.soul_donations(created_at DESC);

-- Enable RLS
ALTER TABLE public.soul_donations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all donations (for leaderboard)
CREATE POLICY "Anyone can view soul donations"
ON public.soul_donations
FOR SELECT
USING (true);

-- Policy: Users can insert their own donations
CREATE POLICY "Users can insert their own soul donations"
ON public.soul_donations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

-- Create function to get soul donations leaderboard
CREATE OR REPLACE FUNCTION get_soul_donations_stats()
RETURNS TABLE (
  wallet_address TEXT,
  total_donated INTEGER,
  donation_count INTEGER,
  last_donation_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH donation_totals AS (
    SELECT 
      sd.wallet_address,
      SUM(sd.amount)::INTEGER as total_donated,
      COUNT(*)::INTEGER as donation_count,
      MAX(sd.created_at) as last_donation_at
    FROM soul_donations sd
    GROUP BY sd.wallet_address
  )
  SELECT 
    dt.wallet_address,
    dt.total_donated,
    dt.donation_count,
    dt.last_donation_at,
    ROW_NUMBER() OVER (ORDER BY dt.total_donated DESC, dt.last_donation_at ASC)::INTEGER as rank
  FROM donation_totals dt
  ORDER BY rank ASC;
END;
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_soul_donations_updated_at
  BEFORE UPDATE ON public.soul_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();