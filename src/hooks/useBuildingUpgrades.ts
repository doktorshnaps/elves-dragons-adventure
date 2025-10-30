import { useState, useEffect } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useToast } from './use-toast';

interface UpgradeProgress {
  buildingId: string;
  startTime: number;
  duration: number;
  targetLevel: number;
  status?: 'in_progress' | 'ready';
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

  // Убираем авто-синхронизацию, сохраняем только по явным действиям (start/ready/install)
  // это предотвращает сетевой спам RPC вызовами


  // Проверяем завершенные улучшения и помечаем как готовые к установке
  useEffect(() => {
    if (activeUpgrades.length === 0) return;
    
    const now = Date.now();
    let changed = false;

    const updated = activeUpgrades.map(upgrade => {
      const isDone = now >= upgrade.startTime + upgrade.duration;
      if (isDone && upgrade.status !== 'ready') {
        changed = true;
        toast({
          title: 'Улучшение завершено',
          description: `Доступно к установке: уровень ${upgrade.targetLevel}`
        });
        return { ...upgrade, status: 'ready' as const };
      }
      return upgrade;
    });

    if (changed) {
      setActiveUpgrades(updated);
      gameState.actions.batchUpdate({ activeBuildingUpgrades: updated });
    }
  }, [activeUpgrades, gameState.actions, toast]);

  // Дополнительная проверка таймеров каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeUpgrades.length === 0) return;
      
      const now = Date.now();
      let needsUpdate = false;

      const updated = activeUpgrades.map(upgrade => {
        const isDone = now >= upgrade.startTime + upgrade.duration;
        if (isDone && upgrade.status !== 'ready') {
          needsUpdate = true;
          toast({
            title: 'Улучшение завершено',
            description: `Доступно к установке: уровень ${upgrade.targetLevel}`
          });
          return { ...upgrade, status: 'ready' as const };
        }
        return upgrade;
      });

      if (needsUpdate) {
        setActiveUpgrades(updated);
        gameState.actions.batchUpdate({ activeBuildingUpgrades: updated });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeUpgrades, gameState.actions, toast]);

  const startUpgrade = (buildingId: string, duration: number, targetLevel: number) => {
    console.log('🚀 [startUpgrade] Starting upgrade:', {
      buildingId,
      duration,
      targetLevel,
      currentActiveUpgrades: activeUpgrades.length
    });
    
    const upgrade: UpgradeProgress = {
      buildingId,
      startTime: Date.now(),
      duration: duration * 60 * 1000, // Конвертируем минуты в миллисекунды
      targetLevel,
      status: 'in_progress'
    };

    const newUpgrades = [...activeUpgrades, upgrade];
    console.log('🚀 [startUpgrade] New upgrades array:', newUpgrades);
    
    setActiveUpgrades(newUpgrades);
    gameState.actions.batchUpdate({ activeBuildingUpgrades: newUpgrades })
      .then(() => {
        console.log('✅ [startUpgrade] Successfully saved to server');
      })
      .catch((error) => {
        console.error('❌ [startUpgrade] Failed to save:', error);
      });
  };

  const installUpgrade = (buildingId: string) => {
    console.log('🏗️ [installUpgrade] Starting installation for:', buildingId);
    
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    console.log('🏗️ [installUpgrade] Found upgrade:', upgrade);
    
    if (!upgrade || upgrade.status !== 'ready') {
      console.log('🏗️ [installUpgrade] Upgrade not ready or not found:', {
        upgradeExists: !!upgrade,
        status: upgrade?.status,
        activeUpgrades
      });
      return;
    }

    const currentBuildingLevels = gameState.buildingLevels || {};
    const newBuildingLevels = { ...currentBuildingLevels, [buildingId]: upgrade.targetLevel };
    const remaining = activeUpgrades.filter(u => u.buildingId !== buildingId);

    console.log('🏗️ [installUpgrade] Updating levels:', {
      buildingId,
      fromLevel: currentBuildingLevels[buildingId] || 0,
      toLevel: upgrade.targetLevel,
      newBuildingLevels,
      remainingUpgrades: remaining.length
    });

    setActiveUpgrades(remaining);
    
    // Сначала обновляем локальное состояние, затем сервер
    gameState.actions.batchUpdate({
      buildingLevels: newBuildingLevels,
      activeBuildingUpgrades: remaining
    }).then(() => {
      console.log('✅ [installUpgrade] Successfully updated building level');
    }).catch((error) => {
      console.error('❌ [installUpgrade] Failed to update:', error);
    });

    toast({
      title: 'Установка выполнена',
      description: `Здание обновлено до уровня ${upgrade.targetLevel}`
    });
  };
  const getUpgradeProgress = (buildingId: string) => {
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    if (!upgrade) return null;

    if (upgrade.status === 'ready') {
      return {
        progress: 100,
        remainingTime: 0,
        targetLevel: upgrade.targetLevel
      };
    }

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
    startUpgradeAtomic: async (
      buildingId: string,
      duration: number,
      targetLevel: number,
      resourcePatch: { wood?: number; stone?: number; iron?: number; gold?: number; balance?: number; inventory?: any[] }
    ) => {
      console.log('🚀 [startUpgradeAtomic] Starting atomic upgrade:', {
        buildingId,
        duration,
        targetLevel,
        resourcePatch
      });
      
      const upgrade: UpgradeProgress = {
        buildingId,
        startTime: Date.now(),
        duration: duration * 60 * 1000,
        targetLevel,
        status: 'in_progress'
      };

      const newUpgrades = [...activeUpgrades, upgrade];
      console.log('🚀 [startUpgradeAtomic] Setting active upgrades:', newUpgrades);
      setActiveUpgrades(newUpgrades);

      try {
        await gameState.actions.batchUpdate({
          ...resourcePatch,
          activeBuildingUpgrades: newUpgrades
        });
        console.log('✅ [startUpgradeAtomic] Successfully saved upgrade to server');
      } catch (error) {
        console.error('❌ [startUpgradeAtomic] Failed to save upgrade:', error);
        throw error;
      }
    },
    installUpgrade,
    getUpgradeProgress,
    isUpgrading,
    formatRemainingTime,
    isUpgradeReady: (buildingId: string) => {
      const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
      return upgrade?.status === 'ready';
    }
  };
};