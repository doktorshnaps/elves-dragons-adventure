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

  const startUpgrade = (buildingId: string, duration: number, targetLevel: number) => {
    // Главный зал и склад не требуют рабочих
    if (buildingId !== 'main_hall' && buildingId !== 'storage') {
      const hasWorkersInBuilding = gameState?.activeWorkers?.some((worker: any) => worker.building === buildingId) || false;
      if (!hasWorkersInBuilding) {
        toast({
          title: "Здание неактивно",
          description: `Назначьте рабочих в ${buildingId} для начала улучшения`,
          variant: "destructive"
        });
        return;
      }
    }

    const upgrade: UpgradeProgress = {
      buildingId,
      startTime: Date.now(),
      duration: duration * 60 * 1000, // Конвертируем минуты в миллисекунды
      targetLevel,
      status: 'in_progress'
    };

    const newUpgrades = [...activeUpgrades, upgrade];
    setActiveUpgrades(newUpgrades);
    
    // Сразу сохраняем в gameState
    gameState.actions.batchUpdate({ activeBuildingUpgrades: newUpgrades });
  };

  const installUpgrade = (buildingId: string) => {
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    if (!upgrade || upgrade.status !== 'ready') return;

    const buildingLevels = { ...gameState.buildingLevels, [buildingId]: upgrade.targetLevel } as any;
    const remaining = activeUpgrades.filter(u => u.buildingId !== buildingId);

    setActiveUpgrades(remaining);
    gameState.actions.batchUpdate({
      buildingLevels,
      activeBuildingUpgrades: remaining
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
      resourcePatch: { wood?: number; stone?: number; iron?: number; gold?: number; balance?: number }
    ) => {
      // Главный зал и склад не требуют рабочих
      if (buildingId !== 'main_hall' && buildingId !== 'storage') {
        const hasWorkersInBuilding = gameState?.activeWorkers?.some((worker: any) => worker.building === buildingId) || false;
        if (!hasWorkersInBuilding) {
          toast({
            title: "Здание неактивно",
            description: `Назначьте рабочих в ${buildingId} для начала улучшения`,
            variant: "destructive"
          });
          return;
        }
      }

      const upgrade: UpgradeProgress = {
        buildingId,
        startTime: Date.now(),
        duration: duration * 60 * 1000,
        targetLevel,
        status: 'in_progress'
      };

      const newUpgrades = [...activeUpgrades, upgrade];
      setActiveUpgrades(newUpgrades);

      await gameState.actions.batchUpdate({
        ...resourcePatch,
        activeBuildingUpgrades: newUpgrades
      });
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