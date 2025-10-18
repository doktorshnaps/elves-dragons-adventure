# Система NFT карточек

## Обзор

NFT карточки теперь хранят все свои характеристики (здоровье, убийства монстров и т.д.) в таблице `card_instances`, как и обычные карточки. Это обеспечивает:

- ✅ Сохранение прогресса карточки независимо от владельца
- ✅ Автоматический перенос статистики при смене владельца
- ✅ Единая система для обычных и NFT карточек
- ✅ Защита от потери прогресса при трансфере NFT

## Архитектура

### База данных

#### Таблица `card_instances`
```sql
- nft_contract_id (TEXT, nullable) - ID контракта NFT
- nft_token_id (TEXT, nullable) - ID токена NFT
- current_health (INTEGER) - текущее здоровье
- max_health (INTEGER) - максимальное здоровье
- monster_kills (INTEGER) - количество убитых монстров
- wallet_address (TEXT) - текущий владелец
```

**Уникальный индекс**: `(nft_contract_id, nft_token_id)` - одна NFT = одна запись

### Функции базы данных

#### `upsert_nft_card_instance`
Создает или обновляет запись NFT карточки. При смене владельца автоматически переносит все характеристики:

```typescript
await supabase.rpc('upsert_nft_card_instance', {
  p_wallet_address: 'mr_bruts.tg',
  p_nft_contract_id: 'doubledog.hot.tg',
  p_nft_token_id: '123',
  p_card_template_id: 'hero_warrior',
  p_card_type: 'hero',
  p_max_health: 100,
  p_card_data: { /* ... */ }
});
```

#### `get_nft_card_stats`
Получает статистику NFT карточки по уникальным идентификаторам:

```typescript
const { data } = await supabase.rpc('get_nft_card_stats', {
  p_nft_contract_id: 'doubledog.hot.tg',
  p_nft_token_id: '123'
});
// returns: { current_health, max_health, monster_kills, current_owner, is_in_medical_bay }
```

#### `cleanup_transferred_nft_cards`
Удаляет записи NFT, которые больше не принадлежат пользователю:

```typescript
await supabase.rpc('cleanup_transferred_nft_cards', {
  p_wallet_address: 'mr_bruts.tg',
  p_current_nft_tokens: [
    { contract_id: 'doubledog.hot.tg', token_id: '123' }
  ]
});
```

#### `increment_card_monster_kills`
Увеличивает счетчик убитых монстров (работает для обычных и NFT карт):

```typescript
await supabase.rpc('increment_card_monster_kills', {
  p_card_template_id: 'hero_warrior',
  p_wallet_address: 'mr_bruts.tg',
  p_kills_to_add: 1
});
```

## Использование в коде

### Хук `useNFTCardStats`

```typescript
import { useNFTCardStats } from '@/hooks/useNFTCardStats';

const MyComponent = () => {
  const {
    getNFTStats,        // Получить полную статистику NFT
    getNFTInstance,     // Получить локальный инстанс NFT
    getNFTHealth,       // Получить текущее/макс здоровье
    getNFTMonsterKills, // Получить количество убийств
    isNFTInMedicalBay,  // Проверить, в медбее ли карта
    refreshStats        // Обновить данные
  } = useNFTCardStats();

  // Получить здоровье NFT
  const health = getNFTHealth('doubledog.hot.tg', '123');
  console.log(`HP: ${health.current}/${health.max}`);

  // Получить убийства
  const kills = getNFTMonsterKills('doubledog.hot.tg', '123');
  console.log(`Kills: ${kills}`);
};
```

### Синхронизация NFT

Хук `useNFTCardIntegration` автоматически:

1. **При обнаружении новой NFT** - создает запись в `card_instances`
2. **При смене владельца** - обновляет `wallet_address`, сохраняя все характеристики
3. **При потере NFT** - удаляет запись у старого владельца (она остается в БД для нового владельца)

```typescript
// Синхронизация происходит автоматически каждые 5 минут
// Или вызовите вручную:
const { syncNFTsFromWallet } = useNFTCardIntegration();
await syncNFTsFromWallet();
```

## Сценарии использования

### 1. Первое обнаружение NFT

```
Пользователь А получает NFT (contract: doubledog.hot.tg, token: 123)
↓
useNFTCardIntegration синхронизирует NFT
↓
upsert_nft_card_instance создает новую запись:
  - wallet_address: "user_a.tg"
  - current_health: 100
  - max_health: 100
  - monster_kills: 0
  - nft_contract_id: "doubledog.hot.tg"
  - nft_token_id: "123"
```

### 2. Использование NFT в игре

```
Пользователь А играет с NFT карточкой
↓
После боя вызывается increment_card_monster_kills
↓
Обновляется запись:
  - monster_kills: 5
  - current_health: 75 (если получил урон)
```

### 3. Трансфер NFT

```
Пользователь А передает NFT Пользователю Б
↓
useNFTCardIntegration у Пользователя Б синхронизирует NFT
↓
upsert_nft_card_instance находит существующую запись:
  - Обновляет wallet_address: "user_a.tg" → "user_b.tg"
  - СОХРАНЯЕТ все характеристики:
    - monster_kills: 5 ✅
    - current_health: 75 ✅
    - max_health: 100 ✅
↓
cleanup_transferred_nft_cards у Пользователя А:
  - Удаляет локальную ссылку (запись остается в БД для Пользователя Б)
```

### 4. Получение статистики

```typescript
// Получить текущего владельца и статистику NFT
const stats = await supabase.rpc('get_nft_card_stats', {
  p_nft_contract_id: 'doubledog.hot.tg',
  p_nft_token_id: '123'
});

console.log(`Current owner: ${stats.current_owner}`);
console.log(`HP: ${stats.current_health}/${stats.max_health}`);
console.log(`Kills: ${stats.monster_kills}`);
```

## Безопасность

- ✅ Все функции используют `SECURITY DEFINER` и `SET search_path = public`
- ✅ Уникальный индекс предотвращает дубликаты NFT
- ✅ RLS политики на `card_instances` защищают данные пользователей
- ✅ Трансфер NFT автоматически обновляет владельца без потери данных

## Тестирование

### Проверка создания NFT инстанса

```sql
SELECT * FROM card_instances 
WHERE nft_contract_id = 'doubledog.hot.tg' 
  AND nft_token_id = '123';
```

### Проверка трансфера

```sql
-- До трансфера
SELECT wallet_address, monster_kills FROM card_instances 
WHERE nft_token_id = '123';
-- wallet_address: user_a.tg, monster_kills: 5

-- После трансфера (автоматически)
SELECT wallet_address, monster_kills FROM card_instances 
WHERE nft_token_id = '123';
-- wallet_address: user_b.tg, monster_kills: 5 ✅
```

## Логирование

Все операции логируются в PostgreSQL logs:
- `NFT transferred: contract=..., token=..., old_owner=..., new_owner=...`
- `New NFT card instance created: contract=..., token=..., owner=...`
- `Incremented monster kills for card ... by ...`
- `Cleaned up N transferred NFT cards for wallet ...`
