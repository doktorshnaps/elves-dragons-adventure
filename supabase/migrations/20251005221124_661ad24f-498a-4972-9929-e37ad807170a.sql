-- Create storage bucket for quest images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quest-images', 'quest-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link_url TEXT NOT NULL,
  image_url TEXT,
  reward_coins INTEGER NOT NULL DEFAULT 100,
  quest_type TEXT NOT NULL DEFAULT 'social',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by_wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_quest_progress table
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address TEXT NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, quest_id)
);

-- Enable RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quests
CREATE POLICY "Anyone can view active quests"
  ON public.quests FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quests"
  ON public.quests FOR ALL
  USING (is_admin_wallet());

-- RLS Policies for user_quest_progress
CREATE POLICY "Users can view their own quest progress"
  ON public.user_quest_progress FOR SELECT
  USING (auth.uid() IS NOT NULL AND (wallet_address = get_current_user_wallet() OR user_id = auth.uid()));

CREATE POLICY "Users can insert their own quest progress"
  ON public.user_quest_progress FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (wallet_address = get_current_user_wallet() OR user_id = auth.uid()));

CREATE POLICY "Users can update their own quest progress"
  ON public.user_quest_progress FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (wallet_address = get_current_user_wallet() OR user_id = auth.uid()));

-- Storage policies for quest images
CREATE POLICY "Anyone can view quest images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quest-images');

CREATE POLICY "Admins can upload quest images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quest-images' AND is_admin_wallet());

CREATE POLICY "Admins can update quest images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quest-images' AND is_admin_wallet());

CREATE POLICY "Admins can delete quest images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'quest-images' AND is_admin_wallet());

-- Migrate existing Gold Ticket Team quest
INSERT INTO public.quests (title, description, link_url, reward_coins, quest_type, is_active, display_order, created_by_wallet_address)
VALUES (
  'Подписаться на Gold Ticket Team',
  'Подпишись на наш Telegram канал',
  'https://t.me/Gold_ticket_team',
  100,
  'social',
  true,
  1,
  'mr_bruts.tg'
)
ON CONFLICT DO NOTHING;