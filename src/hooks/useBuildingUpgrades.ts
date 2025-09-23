import { useState, useEffect } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useToast } from './use-toast';

interface UpgradeProgress {
  buildingId: string;
  startTime: number;
  duration: number;
  targetLevel: number;
}

export const useBuildingUpgrades = () => {
  const gameState = useUnifiedGameState();
  const { toast } = useToast();
  const [activeUpgrades, setActiveUpgrades] = useState<UpgradeProgress[]>([]);

  // Загружаем активные улучшения из gameState при инициализации
  useEffect(() => {
    if (gameState.activeBuildingUpgrades && Array.isArray(gameState.activeBuildingUpgrades)) {
      setActiveUpgrades(gameState.activeBuildingUpgrades);
    }
  }, [gameState.activeBuildingUpgrades]);

  // Сохраняем активные улучшения в gameState и синхронизируем с БД
  useEffect(() => {
    if (activeUpgrades.length > 0 || gameState.activeBuildingUpgrades?.length > 0) {
      gameState.actions.batchUpdate({ activeBuildingUpgrades: activeUpgrades });
    }
  }, [activeUpgrades]);

  // Проверяем завершенные улучшения
  useEffect(() => {
    const now = Date.now();
    const completedUpgrades = activeUpgrades.filter(upgrade => 
      now >= upgrade.startTime + upgrade.duration
    );

    if (completedUpgrades.length > 0) {
      // Обновляем уровни зданий
      const buildingLevels = { ...gameState.buildingLevels };
      completedUpgrades.forEach(upgrade => {
        buildingLevels[upgrade.buildingId] = upgrade.targetLevel;
        
        toast({
          title: "Улучшение завершено!",
          description: `Здание достигло ${upgrade.targetLevel} уровня`
        });
      });

      // Применяем изменения в базе данных
      const remainingUpgrades = activeUpgrades.filter(upgrade => 
        now < upgrade.startTime + upgrade.duration
      );
      
      gameState.actions.batchUpdate({ 
        buildingLevels,
        activeBuildingUpgrades: remainingUpgrades
      });

      // Удаляем завершенные улучшения
      setActiveUpgrades(remainingUpgrades);
    }
  }, [activeUpgrades, gameState.actions, gameState.buildingLevels, toast]);

  const startUpgrade = (buildingId: string, duration: number, targetLevel: number) => {
    const upgrade: UpgradeProgress = {
      buildingId,
      startTime: Date.now(),
      duration: duration * 60 * 1000, // Конвертируем минуты в миллисекунды
      targetLevel
    };

    const newUpgrades = [...activeUpgrades, upgrade];
    setActiveUpgrades(newUpgrades);
    
    // Сразу сохраняем в gameState
    gameState.actions.batchUpdate({ activeBuildingUpgrades: newUpgrades });
  };

  const getUpgradeProgress = (buildingId: string) => {
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    if (!upgrade) return null;

    const now = Date.now();
    const elapsed = now - upgrade.startTime;
    const progress = Math.min(100, (elapsed / upgrade.duration) * 100);
    const remainingTime = Math.max(0, upgrade.duration - elapsed);

    return {
      progress,
      remainingTime,
      targetLevel: upgrade.targetLevel
    };
  };

  const isUpgrading = (buildingId: string) => {
    return activeUpgrades.some(upgrade => upgrade.buildingId === buildingId);
  };

  const formatRemainingTime = (milliseconds: number) => {
    const totalMinutes = Math.ceil(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  return {
    startUpgrade,
    getUpgradeProgress,
    isUpgrading,
    formatRemainingTime
  };
};