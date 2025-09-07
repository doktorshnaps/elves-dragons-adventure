-- Добавляем индексы для улучшения производительности

-- Индексы для таблицы game_data
CREATE INDEX IF NOT EXISTS idx_game_data_wallet_address ON public.game_data(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_data_updated_at ON public.game_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_game_data_account_level ON public.game_data(account_level);

-- Индексы для таблицы card_instances  
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_address ON public.card_instances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_card_instances_card_type ON public.card_instances(card_type);
CREATE INDEX IF NOT EXISTS idx_card_instances_template_id ON public.card_instances(card_template_id);
CREATE INDEX IF NOT EXISTS idx_card_instances_health ON public.card_instances(current_health);

-- Индексы для таблицы marketplace_listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_wallet ON public.marketplace_listings(seller_wallet_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON public.marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at);

-- Составной индекс для активных объявлений по типу и цене
CREATE INDEX IF NOT EXISTS idx_marketplace_active_by_type_price ON public.marketplace_listings(type, price) WHERE status = 'active';

-- Индексы для таблицы user_nft_cards
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_wallet_address ON public.user_nft_cards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_contract_id ON public.user_nft_cards(nft_contract_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_cards_template_name ON public.user_nft_cards(card_template_name);