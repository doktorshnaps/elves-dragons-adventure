import { useState } from 'react';
import { useGameData } from '@/hooks/useGameData';

interface MonsterKill {
  level: number;
  dungeonType: string;
}

interface DungeonReward {
  balance: number;
  monstersKilled: number;
  totalLevels: number;
  dungeonCompleted: boolean;
}

export const useDungeonRewards = () => {
  const { gameData, updateGameData } = useGameData();
  const [pendingReward, setPendingReward] = useState<DungeonReward | null>(null);

  // Расчет награды за монстра в зависимости от уровня и подземелья
  const getMonsterReward = (level: number, dungeonType: string): number => {
    if (dungeonType !== 'spider_nest') return 0;
    
    if (level >= 1 && level <= 3) return 1;
    if (level >= 4 && level <= 7) return 2;
    if (level >= 8 && level <= 10) return 5;
    
    return 0;
  };

  // Обработка убийства монстра
  const handleMonsterKill = (level: number, dungeonType: string) => {
    const reward = getMonsterReward(level, dungeonType);
    return reward;
  };

  // Обработка завершения подземелья или смерти команды
  const processDungeonCompletion = async (
    monstersKilled: MonsterKill[],
    totalLevels: number,
    dungeonCompleted: boolean = false
  ) => {
    // Подсчитываем общую награду
    let totalReward = 0;
    monstersKilled.forEach(monster => {
      totalReward += getMonsterReward(monster.level, monster.dungeonType);
    });

    // Бонус за полное завершение подземелья
    if (dungeonCompleted && totalLevels >= 10) {
      totalReward += 50; // Бонус за завершение всех 10 уровней
    }

    // Зачисляем награду на баланс
    if (totalReward > 0) {
      await updateGameData({ 
        balance: gameData.balance + totalReward 
      });
    }

    // Устанавливаем данные для модального окна
    const reward: DungeonReward = {
      balance: totalReward,
      monstersKilled: monstersKilled.length,
      totalLevels,
      dungeonCompleted
    };

    setPendingReward(reward);
    return reward;
  };

  const clearPendingReward = () => {
    setPendingReward(null);
  };

  return {
    pendingReward,
    handleMonsterKill,
    processDungeonCompletion,
    clearPendingReward
  };
};