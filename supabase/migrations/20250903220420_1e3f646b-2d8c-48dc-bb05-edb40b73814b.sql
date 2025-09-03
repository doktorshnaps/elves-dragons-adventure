-- Create table for card templates with game characteristics
CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  power INTEGER NOT NULL DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  faction TEXT,
  card_type TEXT NOT NULL DEFAULT 'hero',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read card templates (they are game data)
CREATE POLICY "Anyone can view card templates" 
ON public.card_templates 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_card_templates_updated_at
BEFORE UPDATE ON public.card_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some example card templates
INSERT INTO public.card_templates (name, power, defense, health, rarity, faction, card_type, description) VALUES
('Fire Dragon', 85, 70, 120, 'legendary', 'fire', 'dragon', 'Древний огненный дракон с разрушительной силой'),
('Ice Knight', 75, 90, 100, 'epic', 'ice', 'hero', 'Закаленный воин ледяных земель'),
('Forest Guardian', 60, 80, 110, 'rare', 'nature', 'hero', 'Защитник священных лесов'),
('Shadow Assassin', 95, 50, 80, 'epic', 'shadow', 'hero', 'Мастер скрытности и смертельных ударов'),
('Thunder Dragon', 90, 65, 130, 'legendary', 'lightning', 'dragon', 'Повелитель молний и грома'),
('Crystal Mage', 70, 60, 90, 'rare', 'crystal', 'hero', 'Маг кристальной магии'),
('Blood Warrior', 80, 75, 105, 'epic', 'blood', 'hero', 'Бесстрашный воин кровавых битв'),
('Wind Elemental', 65, 55, 95, 'rare', 'wind', 'hero', 'Существо воздушной стихии'),
('Earth Dragon', 70, 95, 140, 'legendary', 'earth', 'dragon', 'Древний страж земных недр'),
('Light Paladin', 75, 85, 110, 'epic', 'light', 'hero', 'Священный воин света');

-- Create table for NFT mapping to track user's NFT collection
CREATE TABLE public.user_nft_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  nft_contract_id TEXT NOT NULL,
  nft_token_id TEXT NOT NULL,
  card_template_name TEXT NOT NULL REFERENCES public.card_templates(name),
  nft_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, nft_contract_id, nft_token_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_nft_cards ENABLE ROW LEVEL SECURITY;

-- Users can view their own NFT cards
CREATE POLICY "Users can view their own NFT cards" 
ON public.user_nft_cards 
FOR SELECT 
USING (wallet_address IS NOT NULL);

-- Users can insert their own NFT cards
CREATE POLICY "Users can insert their own NFT cards" 
ON public.user_nft_cards 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

-- Users can update their own NFT cards
CREATE POLICY "Users can update their own NFT cards" 
ON public.user_nft_cards 
FOR UPDATE 
USING (wallet_address IS NOT NULL);

-- Users can delete their own NFT cards
CREATE POLICY "Users can delete their own NFT cards" 
ON public.user_nft_cards 
FOR DELETE 
USING (wallet_address IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_nft_cards_updated_at
BEFORE UPDATE ON public.user_nft_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();