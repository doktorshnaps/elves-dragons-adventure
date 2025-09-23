import { useState, useCallback } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';

export interface MonsterKill {
  level: number;
  dungeonType: string;
}

export interface DungeonReward {
  totalELL: number;
  monstersKilled: number;
  completionBonus: number;
  breakdown: {
    level1to3: { count: number; reward: number };
    level4to7: { count: number; reward: number };
    level8to10: { count: number; reward: number };
  };
  isFullCompletion: boolean;
}

export const useDungeonRewards = () => {
  const [pendingReward, setPendingReward] = useState<DungeonReward | null>(null);
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();

  const calculateReward = useCallback((monsters: MonsterKill[]): DungeonReward => {
    let level1to3Count = 0;
    let level4to7Count = 0;
    let level8to10Count = 0;

    // Подсчитываем убитых монстров по уровням для подземелья "Гнездо Гигантских Пауков"
    monsters.forEach(monster => {
      if (monster.dungeonType === 'spider_nest') {
        if (monster.level >= 1 && monster.level <= 3) {
          level1to3Count++;
        } else if (monster.level >= 4 && monster.level <= 7) {
          level4to7Count++;
        } else if (monster.level >= 8 && monster.level <= 10) {
          level8to10Count++;
        }
      }
    });

    // Рассчитываем награды согласно условиям
    const level1to3Reward = level1to3Count * 1; // 1 ELL за монстров 1-3 уровня
    const level4to7Reward = level4to7Count * 2; // 2 ELL за монстров 4-7 уровня
    const level8to10Reward = level8to10Count * 5; // 5 ELL за монстров 8-10 уровня

    const totalELL = level1to3Reward + level4to7Reward + level8to10Reward;
    
    return {
      totalELL,
      monstersKilled: monsters.length,
      completionBonus: 0, // Пока без бонуса за завершение
      breakdown: {
        level1to3: { count: level1to3Count, reward: level1to3Reward },
        level4to7: { count: level4to7Count, reward: level4to7Reward },
        level8to10: { count: level8to10Count, reward: level8to10Reward }
      },
      isFullCompletion: false // Устанавливается при полном завершении подземелья
    };
  }, []);

  const processDungeonCompletion = useCallback(async (
    monsters: MonsterKill[], 
    currentLevel: number, 
    isFullCompletion: boolean = false
  ) => {
    if (monsters.length === 0) return;

    const reward = calculateReward(monsters);
    reward.isFullCompletion = isFullCompletion;

    // Если полное завершение подземелья (дошли до 10 уровня), добавляем бонус
    if (isFullCompletion) {
      reward.completionBonus = Math.floor(reward.totalELL * 0.5); // 50% бонус за полное завершение
      reward.totalELL += reward.completionBonus;
    }

    if (reward.totalELL > 0) {
      // Показываем модальное окно с наградой сразу
      setPendingReward(reward);

      toast({
        title: "Награда получена!",
        description: `Получено ${reward.totalELL} ELL за убийство монстров`,
      });
    }
  }, [calculateReward, toast]);

  const clearPendingReward = useCallback(async () => {
    if (pendingReward) {
      try {
        // Обновляем баланс при закрытии модального окна - добавляем к текущему балансу
        const currentBalance = gameData.balance || 0;
        const newBalance = currentBalance + pendingReward.totalELL;
        await updateGameData({ balance: newBalance });
        console.log(`💰 Добавлен баланс: ${pendingReward.totalELL} ELL (было: ${currentBalance}, стало: ${newBalance})`);
      } catch (error) {
        console.error('Ошибка при начислении награды:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось начислить награду",
          variant: "destructive"
        });
      }
    }
    setPendingReward(null);
  }, [pendingReward, gameData.balance, updateGameData, toast]);

  return {
    pendingReward,
    processDungeonCompletion,
    clearPendingReward,
    calculateReward
  };
};