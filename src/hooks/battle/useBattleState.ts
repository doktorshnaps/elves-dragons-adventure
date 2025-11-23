import { useState, useCallback, useRef } from 'react';
import { TeamPair } from '@/types/teamBattle';
import { Opponent } from '@/types/battle';

export interface BattleStats {
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

export interface LocalBattleState {
  playerPairs: TeamPair[];
  opponents: Opponent[];
  currentLevel: number;
  stats: BattleStats;
  isInBattle: boolean;
}

export const useBattleState = (dungeonType: string) => {
  const [battleState, setBattleState] = useState<LocalBattleState>({
    playerPairs: [],
    opponents: [],
    currentLevel: 1,
    stats: {
      monstersKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      experienceGained: 0,
      ellEarned: 0,
      lootedItems: [],
      cardKills: []
    },
    isInBattle: false
  });

  const claimKeyRef = useRef<string | null>(null);

  // Начало боя - инициализация состояния
  const startBattle = useCallback((pairs: TeamPair[], opponents: Opponent[], level: number) => {
    console.log('🎮 [BattleState] Starting battle', { level, pairs: pairs.length, opponents: opponents.length });
    setBattleState({
      playerPairs: pairs,
      opponents,
      currentLevel: level,
      stats: {
        monstersKilled: 0,
        damageDealt: 0,
        damageTaken: 0,
        experienceGained: 0,
        ellEarned: 0,
        lootedItems: [],
        cardKills: []
      },
      isInBattle: true
    });
  }, []);

  // Обновление здоровья игрока
  const updatePlayerHealth = useCallback((pairId: string, newHealth: number, damage: number) => {
    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(p => 
        p.id === pairId ? { ...p, health: Math.max(0, newHealth) } : p
      ),
      stats: {
        ...prev.stats,
        damageTaken: prev.stats.damageTaken + damage
      }
    }));
  }, []);

  // Обновление брони игрока
  const updatePlayerDefense = useCallback((pairId: string, newDefense: number) => {
    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(p => 
        p.id === pairId ? { ...p, currentDefense: Math.max(0, newDefense) } : p
      )
    }));
  }, []);

  // Нанесение урона врагу
  const damageEnemy = useCallback((enemyId: number, damage: number, newHealth: number) => {
    setBattleState(prev => ({
      ...prev,
      opponents: prev.opponents.map(opp => 
        opp.id === enemyId 
          ? { ...opp, health: Math.max(0, newHealth), isDead: newHealth <= 0 }
          : opp
      ),
      stats: {
        ...prev.stats,
        damageDealt: prev.stats.damageDealt + damage
      }
    }));
  }, []);

  // Добавление убийства монстра (с опытом и наградами)
  const addMonsterKill = useCallback((
    cardTemplateId: string,
    experience: number,
    ellReward: number,
    loot: Array<{ template_id: number; item_id: string; name: string; type: string; quantity: number }>
  ) => {
    setBattleState(prev => {
      const existingKill = prev.stats.cardKills.find(k => k.card_template_id === cardTemplateId);
      const updatedCardKills = existingKill
        ? prev.stats.cardKills.map(k => 
            k.card_template_id === cardTemplateId 
              ? { ...k, kills: k.kills + 1 }
              : k
          )
        : [...prev.stats.cardKills, { card_template_id: cardTemplateId, kills: 1 }];

      return {
        ...prev,
        stats: {
          ...prev.stats,
          monstersKilled: prev.stats.monstersKilled + 1,
          experienceGained: prev.stats.experienceGained + experience,
          ellEarned: prev.stats.ellEarned + ellReward,
          lootedItems: [...prev.stats.lootedItems, ...loot],
          cardKills: updatedCardKills
        }
      };
    });
  }, []);

  // Переход на следующий уровень
  const nextLevel = useCallback((newOpponents: Opponent[]) => {
    setBattleState(prev => ({
      ...prev,
      opponents: newOpponents,
      currentLevel: prev.currentLevel + 1
    }));
  }, []);

  // Завершение боя (сброс состояния)
  const endBattle = useCallback(() => {
    console.log('🏁 [BattleState] Ending battle');
    setBattleState(prev => ({
      ...prev,
      isInBattle: false
    }));
  }, []);

  // Генерация уникального claim_key для начисления наград
  const generateClaimKey = useCallback((accountId: string) => {
    const key = `battle_${dungeonType}_${accountId}_${battleState.currentLevel}_${Date.now()}`;
    claimKeyRef.current = key;
    return key;
  }, [dungeonType, battleState.currentLevel]);

  return {
    battleState,
    startBattle,
    updatePlayerHealth,
    updatePlayerDefense,
    damageEnemy,
    addMonsterKill,
    nextLevel,
    endBattle,
    generateClaimKey
  };
};
