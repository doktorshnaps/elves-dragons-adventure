
-- Add telegram_chat_id column to game_data
ALTER TABLE public.game_data ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;
CREATE INDEX IF NOT EXISTS idx_game_data_tg_chat ON public.game_data(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- RPC to save telegram chat_id
CREATE OR REPLACE FUNCTION public.save_telegram_chat_id(p_wallet_address text, p_chat_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE game_data SET telegram_chat_id = p_chat_id WHERE wallet_address = p_wallet_address;
END;
$$;

-- Rate limiting table for notifications
CREATE TABLE IF NOT EXISTS public.telegram_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  event_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_notif_log_wallet ON public.telegram_notification_log(wallet_address, sent_at);

ALTER TABLE public.telegram_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.telegram_notification_log
  FOR ALL USING (false);
