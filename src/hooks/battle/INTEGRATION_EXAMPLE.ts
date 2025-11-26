/**
 * ПРИМЕР ИНТЕГРАЦИИ ОПТИМИЗИРОВАННОЙ БОЕВОЙ СИСТЕМЫ
 * 
 * Этот файл показывает, как использовать новую систему в useTeamBattle.ts
 */

import { useState, useCallback } from 'react';
import { useBattleState } from './useBattleState';
import { useBattleRewards } from './useBattleRewards';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { getMonsterLoot } from '@/utils/monsterLootMapping';
import { useToast } from '@/hooks/use-toast';

export const useOptimizedTeamBattle = (dungeonType: string, initialLevel: number = 1) => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  
  // Новая система локального состояния
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
  } = useBattleState(dungeonType);

  // Система клейма наград
  const { claimBattleRewards } = useBattleRewards(accountId);

  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('player');

  // ============= 1. ИНИЦИАЛИЗАЦИЯ БОЕВ =============
  const initializeBattle = useCallback((pairs: any[], opponents: any[]) => {
    startBattle(pairs, opponents, initialLevel);
  }, [startBattle, initialLevel]);

  // ============= 2. АТАКА ИГРОКА (БЕЗ ЗАПРОСОВ В БД) =============
  const executePlayerAttack = useCallback(async (pairId: string, enemyId: number) => {
    const pair = battleState.playerPairs.find(p => p.id === pairId);
    const enemy = battleState.opponents.find(o => o.id === enemyId);
    
    if (!pair || !enemy) return;

    // Расчет урона (локально)
    const damage = Math.max(0, pair.power - enemy.armor);
    const newEnemyHealth = Math.max(0, enemy.health - damage);
    
    // Обновляем здоровье врага (локально)
    damageEnemy(enemyId, damage, newEnemyHealth);

    // Если враг убит - накапливаем награды (локально)
    if (newEnemyHealth <= 0) {
      const expReward = 50; // Пример
      const ellReward = enemy.isBoss ? 10 : 3; // Пример
      
      // Генерируем лут
      const loot = await getMonsterLoot(enemy.name, 1, battleState.currentLevel, accountId || undefined);
      const lootItems = loot.map(item => ({
        template_id: (item as any).template_id,
        item_id: (item as any).item_id,
        name: item.name,
        type: item.type,
        quantity: 1
      }));

      // Накапливаем награды локально (БЕЗ ЗАПРОСОВ В БД!)
      addMonsterKill(
        pair.hero.id,
        expReward,
        ellReward,
        lootItems
      );

      toast({
        title: "Враг побежден!",
        description: `+${ellReward} ELL, +${expReward} опыта (награды будут начислены при выходе)`
      });
    }

    // Смена хода
    setCurrentTurn('enemy');
  }, [battleState, damageEnemy, addMonsterKill, accountId, toast]);

  // ============= 3. АТАКА ВРАГА (БЕЗ ЗАПРОСОВ В БД) =============
  const executeEnemyAttack = useCallback(() => {
    const alivePairs = battleState.playerPairs.filter(p => p.health > 0);
    const aliveEnemies = battleState.opponents.filter(o => o.health > 0);

    if (alivePairs.length === 0 || aliveEnemies.length === 0) return;

    const enemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const targetPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];

    // Расчет урона
    const damage = Math.max(0, enemy.power - targetPair.defense);
    const newHealth = Math.max(0, targetPair.health - damage);

    // Обновляем здоровье игрока (локально)
    updatePlayerHealth(targetPair.id, newHealth, damage);

    // Уменьшаем броню на 1 при любом уроне
    if (damage > 0 && targetPair.currentDefense > 0) {
      updatePlayerDefense(targetPair.id, targetPair.currentDefense - 1);
    }

    // Смена хода
    setCurrentTurn('player');
  }, [battleState, updatePlayerHealth, updatePlayerDefense]);

  // ============= 4. ПЕРЕХОД НА СЛЕДУЮЩИЙ УРОВЕНЬ =============
  const handleNextLevel = useCallback(async () => {
    // Генерируем новых врагов
    const newOpponents = []; // generateDungeonOpponents(...)
    nextLevel(newOpponents);

    toast({
      title: "Следующий уровень!",
      description: `Уровень ${battleState.currentLevel + 1}`
    });
  }, [nextLevel, battleState.currentLevel, toast]);

  // ============= 5. КЛЕЙМ НАГРАД И ВЫХОД (ОДИН ЗАПРОС В БД) =============
  const claimAndExit = useCallback(async () => {
    // Генерируем уникальный ключ для идемпотентности
    const claimKey = generateClaimKey(accountId || 'local');

    // Подготавливаем обновления здоровья всех карточек
    const cardHealthUpdates = battleState.playerPairs.flatMap(pair => {
      const updates = [{
        card_instance_id: pair.hero.id, // ИСПРАВЛЕНО: было card_template_id
        current_health: Math.floor(pair.health), // Здоровье героя
        current_defense: pair.currentDefense || 0
      }];

      // Если есть дракон, добавляем и его
      if (pair.dragon) {
        updates.push({
          card_instance_id: pair.dragon.id, // ИСПРАВЛЕНО: было card_template_id
          current_health: pair.dragon.currentHealth || 0,
          current_defense: pair.dragon.currentDefense || 0
        });
      }

      return updates;
    });

    console.log('💎 Claiming battle rewards', {
      claimKey,
      stats: battleState.stats,
      cardHealthUpdates
    });

    // ОДИН ЗАПРОС В БД - ВСЁ АТОМАРНО
    const result = await claimBattleRewards(
      claimKey,
      dungeonType,
      battleState.currentLevel,
      battleState.stats,
      cardHealthUpdates
    );

    if (result.success) {
      // Награды начислены успешно
      endBattle();
      
      toast({
        title: "🎉 Награды получены!",
        description: `+${battleState.stats.ellEarned} ELL, +${battleState.stats.experienceGained} опыта`,
      });

      // Можно безопасно выходить
      return true;
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось получить награды. Попробуйте снова.",
        variant: "destructive"
      });
      return false;
    }
  }, [
    battleState, 
    claimBattleRewards, 
    dungeonType, 
    accountId, 
    generateClaimKey,
    endBattle,
    toast
  ]);

  // ============= 6. ПОРАЖЕНИЕ (БЕЗ НАГРАД) =============
  const handleDefeat = useCallback(() => {
    console.log('💀 Player defeated - no rewards');
    endBattle();
    
    toast({
      title: "Поражение!",
      description: "Все накопленные награды потеряны",
      variant: "destructive"
    });
  }, [endBattle, toast]);

  return {
    // Состояние
    battleState,
    currentTurn,
    
    // Действия
    initializeBattle,
    executePlayerAttack,
    executeEnemyAttack,
    handleNextLevel,
    claimAndExit,
    handleDefeat,
    
    // Статистика для UI
    stats: battleState.stats
  };
};

/**
 * СРАВНЕНИЕ: СТАРАЯ vs НОВАЯ СИСТЕМА
 * 
 * СТАРАЯ СИСТЕМА (много запросов):
 * ================================
 * 1. Убийство монстра → incrementMonsterKills (RPC)
 * 2. Убийство монстра → addAccountExperience (RPC)
 * 3. Выпадение предмета → claim-item-reward (Edge Function)
 * 4. Обновление здоровья → update_card_instance_health (RPC)
 * 5. Обновление брони → update_card_instance_defense (RPC)
 * 
 * ИТОГО: 5+ запросов в БД за один бой (для каждого монстра!)
 * 
 * НОВАЯ СИСТЕМА (один запрос):
 * ============================
 * 1. Весь бой → локальное состояние (0 запросов)
 * 2. Выход → claim-battle-rewards → apply_battle_rewards (1 RPC, всё в транзакции)
 * 
 * ИТОГО: 1 запрос в БД за весь бой (независимо от количества монстров!)
 * 
 * ПРЕИМУЩЕСТВА:
 * =============
 * ✅ Производительность: 5x-10x меньше запросов
 * ✅ Скорость: нет лагов во время боя
 * ✅ Надежность: идемпотентность через reward_claims
 * ✅ Атомарность: либо всё, либо ничего
 * ✅ Простота: один hook, один Edge Function, один RPC
 */
