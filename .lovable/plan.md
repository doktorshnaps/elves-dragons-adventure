

# План исправления функции game-wipe

## Что нужно изменить

Один файл: `supabase/functions/game-wipe/index.ts`

## Добавляемые очистки

После существующих операций добавить:

| Таблица | Действие | Примечание |
|---------|----------|------------|
| `player_teams` | DELETE `.neq('wallet_address', adminWallet)` | **Корень бага** — старые команды остаются |
| `pvp_ratings` | DELETE `.neq('wallet_address', adminWallet)` | Рейтинги PvP |
| `pvp_decks` | DELETE `.neq('wallet_address', adminWallet)` | PvP колоды |
| `pvp_matches` | DELETE all | История матчей (содержит обоих игроков) |
| `pvp_queue` | DELETE all | Очередь матчмейкинга |
| `user_daily_quest_progress` | DELETE `.neq('wallet_address', adminWallet)` | Прогресс ежедневных квестов |
| `user_nft_cards` | DELETE `.neq('wallet_address', adminWallet)` | NFT-маппинг карт |
| `forge_bay` | DELETE `.neq('wallet_address', adminWallet)` | Карты в кузнице |
| `referral_earnings` | DELETE all (не `.neq`) | Обнулить **заработки**, но НЕ сами связи |
| `active_dungeon_sessions` | DELETE `.neq('account_id', adminWallet)` | Активные сессии подземелий |

## Что НЕ трогаем (по требованию)

- **`referrals`** — таблица связей реферер→реферал остаётся нетронутой
- **`clans`**, **`clan_members`**, **`clan_join_requests`** — кланы и членство сохраняются
- **`clan_raid_events`**, **`clan_raid_attacks`**, **`clan_raid_rankings`** — история рейдов сохраняется

## Дополнительно

Добавить `clan_hall: 0` в объект сброса `building_levels` (строка 100-110).

## Итого

~50 строк добавления в один файл + деплой Edge Function.

