# Оптимизация боевой системы

## Архитектура

Боевая система оптимизирована для минимизации запросов в БД и предотвращения дублирования наград.

### Компоненты

1. **useBattleState** - локальное состояние боя
   - Хранит все изменения во время боя в памяти
   - Никаких запросов в БД до завершения боя
   - Отслеживает: урон, убийства, награды, предметы

2. **useBattleRewards** - клейм наград
   - Вызывает Edge Function `claim-battle-rewards`
   - Атомарная операция в одной транзакции
   - Идемпотентность через `reward_claims`

3. **Edge Function: claim-battle-rewards**
   - Проверяет идемпотентность (таблица `reward_claims`)
   - Вызывает RPC `apply_battle_rewards`
   - Возвращает результаты всех операций

4. **RPC: apply_battle_rewards**
   - Начисляет ELL и опыт аккаунта
   - Добавляет предметы через `add_item_instances`
   - Обновляет счетчики убийств карточек
   - Обновляет здоровье и броню карточек
   - Всё в одной транзакции

## Использование

### 1. Инициализация боя

```typescript
import { useBattleState } from '@/hooks/battle/useBattleState';

const { 
  battleState, 
  startBattle,
  updatePlayerHealth,
  updatePlayerDefense,
  damageEnemy,
  addMonsterKill,
  nextLevel,
  endBattle,
  generateClaimKey
} = useBattleState('spider_nest');

// Начало боя
startBattle(playerPairs, opponents, 1);
```

### 2. Во время боя (локально)

```typescript
// Урон игроку
updatePlayerHealth(pairId, newHealth, damage);

// Уменьшение брони
updatePlayerDefense(pairId, newDefense);

// Урон врагу
damageEnemy(enemyId, damage, newHealth);

// Убийство монстра (накопление наград)
addMonsterKill(
  heroTemplateId,
  experienceGained,
  ellReward,
  lootItems // массив предметов
);
```

### 3. Завершение боя (клейм наград)

```typescript
import { useBattleRewards } from '@/hooks/battle/useBattleRewards';

const { claimBattleRewards } = useBattleRewards(accountId);

// При выходе из подземелья или смерти
const claimKey = generateClaimKey(accountId);

// Подготавливаем обновления здоровья карточек
const cardHealthUpdates = battleState.playerPairs.map(pair => ({
  card_template_id: pair.hero.id,
  current_health: pair.health,
  current_defense: pair.currentDefense
}));

// Клеймим все награды одним запросом
const result = await claimBattleRewards(
  claimKey,
  'spider_nest',
  battleState.currentLevel,
  battleState.stats,
  cardHealthUpdates
);

if (result.success) {
  // Награды начислены, можно выходить
  endBattle();
}
```

## Преимущества

1. **Минимум запросов в БД**
   - Во время боя: 0 запросов
   - При клейме: 1 Edge Function → 1 RPC → все операции в одной транзакции

2. **Идемпотентность**
   - Таблица `reward_claims` предотвращает повторные начисления
   - Уникальный `claim_key` для каждого клейма
   - Защита от двойных кликов и сетевых лагов

3. **Атомарность**
   - Все операции в одной транзакции
   - Либо всё успешно, либо ничего
   - Невозможно частичное начисление

4. **Производительность**
   - Все вычисления на клиенте
   - БД используется только для финального сохранения
   - Быстрый отклик UI

## Схема данных

### BattleStats

```typescript
interface BattleStats {
  monstersKilled: number;
  damageDealt: number;
  damageTaken: number;
  experienceGained: number;
  ellEarned: number;
  lootedItems: Array<{
    template_id: number;
    item_id: string;
    name: string;
    type: string;
    quantity: number;
  }>;
  cardKills: Array<{
    card_template_id: string;
    kills: number;
  }>;
}
```

### Edge Function Request

```typescript
{
  wallet_address: string;
  claim_key: string; // уникальный ключ для идемпотентности
  dungeon_type: string;
  level: number;
  ell_reward: number;
  experience_reward: number;
  items: Array<{
    template_id: number;
    item_id: string;
    name: string;
    type: string;
    quantity: number;
  }>;
  card_kills: Array<{
    card_template_id: string;
    kills: number;
  }>;
  card_health_updates: Array<{
    card_template_id: string;
    current_health: number;
    current_defense: number;
  }>;
}
```

## Безопасность

- Edge Function использует `SECURITY DEFINER`
- RPC функция имеет `SET search_path = public`
- Валидация всех входных данных через Zod
- Идемпотентность через уникальные ключи
- Транзакционность всех операций

## Миграция с текущей системы

Для перехода на новую систему:

1. Заменить использование `useDungeonRewards` на `useBattleState` + `useBattleRewards`
2. Убрать все запросы в БД во время боя (`incrementMonsterKills`, `addAccountExperience`)
3. Накапливать награды локально через `addMonsterKill`
4. При выходе вызывать `claimBattleRewards` один раз
5. Удалить старую логику из `useTeamBattle.ts`

## Тестирование

1. Проверить, что награды начисляются корректно
2. Проверить идемпотентность (двойной клик на "Забрать награды")
3. Проверить транзакционность (отключить интернет на середине)
4. Проверить производительность (отсутствие лагов во время боя)
