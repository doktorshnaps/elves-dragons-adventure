import { useState, useEffect, useCallback } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Opponent } from '@/types/battle';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

interface BattleState {
  playerStats: any;
  opponents: Opponent[];
  currentDungeonLevel: number;
  selectedDungeon: string | null;
  isPlayerTurn: boolean;
}

export const useBattleStateNew = (level: number) => {
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [battleState, setBattleState] = useState<BattleState>(() => {
    if (gameData.battleState) {
      return {
        ...gameData.battleState,
        isPlayerTurn: true
      };
    }
    return {
      playerStats: null,
      opponents: [],
      currentDungeonLevel: level,
      selectedDungeon: null,
      isPlayerTurn: true
    };
  });

  // Синхронизируем с Supabase при изменении состояния битвы
  const updateBattleState = useCallback(async (newState: Partial<BattleState>) => {
    const updatedState = { ...battleState, ...newState };
    setBattleState(updatedState);
    await updateGameData({ battleState: updatedState });
  }, [battleState, updateGameData]);

  // Инициализируем состояние битвы при загрузке
  useEffect(() => {
    if (gameData.battleState && gameData.battleState.playerStats) {
      setBattleState({
        ...gameData.battleState,
        isPlayerTurn: true
      });
    }
  }, [gameData.battleState]);

  const attackEnemy = useCallback(async (enemyId: number) => {
    if (!battleState.isPlayerTurn || !battleState.playerStats) return;

    const enemy = battleState.opponents.find(o => o.id === enemyId);
    if (!enemy || enemy.health <= 0) return;

    // Атака игрока
    const damage = Math.max(1, battleState.playerStats.power - Math.floor(Math.random() * 3));
    const newEnemyHealth = Math.max(0, enemy.health - damage);

    let updatedOpponents = battleState.opponents.map(o =>
      o.id === enemyId ? { ...o, health: newEnemyHealth } : o
    );

    // Проверяем, убит ли враг
    if (newEnemyHealth <= 0) {
      updatedOpponents = updatedOpponents.filter(o => o.id !== enemyId);
      
      // Награда за убийство
      await updateGameData({ 
        balance: gameData.balance + (enemy.experienceReward || 50)
      });
      
      toast({
        title: "Враг побежден!",
        description: `Получено ${enemy.experienceReward || 50} золота`
      });
    }

    // Атака противников
    let newPlayerHealth = battleState.playerStats.health;
    if (updatedOpponents.length > 0) {
      for (const opponent of updatedOpponents) {
        if (opponent.health > 0) {
          const enemyDamage = Math.max(1, opponent.power - Math.floor(battleState.playerStats.defense / 2));
          newPlayerHealth = Math.max(0, newPlayerHealth - enemyDamage);
        }
      }
    }

    // Проверяем, жив ли игрок
    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы были побеждены",
        variant: "destructive"
      });
      
      await updateGameData({ battleState: null });
      setTimeout(() => navigate('/menu'), 2000);
      return;
    }

    const newPlayerStats = {
      ...battleState.playerStats,
      health: newPlayerHealth
    };

    await updateBattleState({
      opponents: updatedOpponents,
      playerStats: newPlayerStats,
      isPlayerTurn: true
    });
  }, [battleState, gameData.balance, updateGameData, updateBattleState, toast, navigate]);

  const handleNextLevel = useCallback(async () => {
    const nextLevel = battleState.currentDungeonLevel + 1;
    const newOpponents = generateDungeonOpponents(battleState.selectedDungeon as DungeonType, nextLevel);

    await updateBattleState({
      opponents: newOpponents,
      currentDungeonLevel: nextLevel
    });

    toast({
      title: "Следующий уровень!",
      description: `Уровень ${nextLevel}`
    });
  }, [battleState, updateBattleState, toast]);

  return {
    playerStats: battleState.playerStats,
    opponents: battleState.opponents,
    isPlayerTurn: battleState.isPlayerTurn,
    attackEnemy,
    handleNextLevel
  };
};