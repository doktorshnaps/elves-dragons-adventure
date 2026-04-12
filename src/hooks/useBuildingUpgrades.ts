import { useState, useEffect, useRef, useCallback } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useGameDataContext } from '@/contexts/GameDataContext';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { sendTelegramNotification } from '@/utils/telegramNotifications';

interface UpgradeProgress {
  buildingId: string;
  startTime: number;
  duration: number;
  targetLevel: number;
  status?: 'in_progress' | 'ready';
}

const upgradeKey = (u: { buildingId: string; status?: string }) =>
  `${u.buildingId}:${u.status ?? 'in_progress'}`;

const upgradesEqual = (a: UpgradeProgress[], b: any[]): boolean => {
  if (a.length !== b.length) return false;
  const aKeys = a.map(upgradeKey).sort().join(',');
  const bKeys = b.map(upgradeKey).sort().join(',');
  return aKeys === bKeys;
};

export const useBuildingUpgrades = () => {
  const gameState = useUnifiedGameState();
  const { gameData } = useGameDataContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accountId } = useWalletContext();
  const [activeUpgrades, setActiveUpgrades] = useState<UpgradeProgress[]>([]);

  const hasReceivedRealData = useRef(false);
  // Track which upgrades have already been transitioned to ready
  const transitionedRef = useRef<Set<string>>(new Set());
  // Track which upgrades have already shown a toast
  const toastedUpgradesRef = useRef<Set<string>>(new Set());

  // Helper to sync upgrades to React Query cache (used only for optimistic UI in start/install)
  const syncToCache = useCallback((upgrades: UpgradeProgress[], extraUpdates?: Record<string, any>) => {
    if (!accountId) return;
    queryClient.setQueryData(['gameData', accountId], (old: any) => {
      if (!old) return old;
      return { ...old, activeBuildingUpgrades: upgrades, ...extraUpdates };
    });
  }, [queryClient, accountId]);

  // Sync from DB — with semantic equality check to break the loop
  useEffect(() => {
    const dbUpgrades = gameData.activeBuildingUpgrades;

    if (Array.isArray(dbUpgrades)) {
      if (dbUpgrades.length > 0) {
        hasReceivedRealData.current = true;
        // Only update if semantically different
        if (!upgradesEqual(activeUpgrades, dbUpgrades)) {
          console.log('🔄 [useBuildingUpgrades] Syncing upgrades from DB:', dbUpgrades);
          setActiveUpgrades(dbUpgrades);
        }
      } else if (hasReceivedRealData.current) {
        if (activeUpgrades.length > 0) {
          console.log('🔄 [useBuildingUpgrades] DB returned empty after real data — clearing');
          setActiveUpgrades([]);
        }
      }
      return;
    }

    // Fallback: gameState
    const gsUpgrades = gameState.activeBuildingUpgrades;
    if (Array.isArray(gsUpgrades) && gsUpgrades.length > 0) {
      hasReceivedRealData.current = true;
      if (!upgradesEqual(activeUpgrades, gsUpgrades)) {
        setActiveUpgrades(gsUpgrades);
      }
    }
  }, [gameData.activeBuildingUpgrades, gameState.activeBuildingUpgrades]);

  // Auto-transition expired upgrades to ready (single effect, no interval, no syncToCache)
  useEffect(() => {
    if (activeUpgrades.length === 0 || !accountId) return;

    const now = Date.now();
    let changed = false;

    const BUILDING_NAMES: Record<string, string> = {
      main_hall: 'Главный зал',
      workshop: 'Мастерская',
      storage: 'Склад',
      sawmill: 'Лесопилка',
      quarry: 'Каменоломня',
      barracks: 'Казармы',
      dragon_lair: 'Драконье логово',
      medical: 'Медицинский блок',
      forge: 'Кузница',
    };

    const updated = activeUpgrades.map(upgrade => {
      const tKey = `${upgrade.buildingId}_${upgrade.startTime}`;
      const isDone = now >= upgrade.startTime + upgrade.duration;
      if (isDone && upgrade.status !== 'ready' && !transitionedRef.current.has(tKey)) {
        transitionedRef.current.add(tKey);
        changed = true;
        const buildingName = BUILDING_NAMES[upgrade.buildingId] || upgrade.buildingId;
        // Toast (once per upgrade)
        if (!toastedUpgradesRef.current.has(tKey)) {
          toastedUpgradesRef.current.add(tKey);
          toast({
            title: 'Улучшение завершено',
            description: `${buildingName}: доступно к установке уровень ${upgrade.targetLevel}`
          });
          // Send Telegram notification
          if (accountId) {
            sendTelegramNotification(
              accountId,
              `🏗️ Улучшение здания завершено!\n${buildingName}: доступно к установке уровень ${upgrade.targetLevel}`,
              `building_ready_${upgrade.buildingId}`
            );
          }
        }
        return { ...upgrade, status: 'ready' as const };
      }
      return upgrade;
    });

    if (changed) {
      console.log('🏗️ [useBuildingUpgrades] Auto-transitioning upgrades to ready');
      setActiveUpgrades(updated);
      // Only batchUpdate — it already does optimistic cache update internally
      gameState.actions.batchUpdate({ activeBuildingUpgrades: updated })
        .catch(err => console.error('❌ [useBuildingUpgrades] Failed to sync upgrade status:', err));
    }
  }, [activeUpgrades, accountId]);

  // Periodic check for upgrades that finish while the page is open (polling, no cache write)
  useEffect(() => {
    if (activeUpgrades.length === 0) return;
    const hasInProgress = activeUpgrades.some(u => u.status !== 'ready');
    if (!hasInProgress) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const needsTransition = activeUpgrades.some(u => {
        const tKey = `${u.buildingId}_${u.startTime}`;
        return now >= u.startTime + u.duration && u.status !== 'ready' && !transitionedRef.current.has(tKey);
      });
      if (needsTransition) {
        // Trigger re-render so the effect above picks it up
        setActiveUpgrades(prev => [...prev]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeUpgrades]);

  const startUpgrade = (buildingId: string, duration: number, targetLevel: number) => {
    const upgrade: UpgradeProgress = {
      buildingId,
      startTime: Date.now(),
      duration: duration * 60 * 1000,
      targetLevel,
      status: 'in_progress'
    };
    const newUpgrades = [...activeUpgrades, upgrade];
    setActiveUpgrades(newUpgrades);
    syncToCache(newUpgrades);
    gameState.actions.batchUpdate({ activeBuildingUpgrades: newUpgrades })
      .then(() => console.log('✅ [startUpgrade] Saved'))
      .catch(err => console.error('❌ [startUpgrade] Failed:', err));
  };

  const installUpgrade = (buildingId: string) => {
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    if (!upgrade || upgrade.status !== 'ready') return;

    const currentBuildingLevels = gameData.buildingLevels || gameState.buildingLevels || {};
    const newBuildingLevels = { ...currentBuildingLevels, [buildingId]: upgrade.targetLevel };
    const remaining = activeUpgrades.filter(u => u.buildingId !== buildingId);

    // Clean up refs
    const tKey = `${upgrade.buildingId}_${upgrade.startTime}`;
    transitionedRef.current.delete(tKey);
    toastedUpgradesRef.current.delete(tKey);

    setActiveUpgrades(remaining);
    syncToCache(remaining, { buildingLevels: newBuildingLevels });

    gameState.actions.batchUpdate({
      buildingLevels: newBuildingLevels,
      activeBuildingUpgrades: remaining
    }).then(() => console.log('✅ [installUpgrade] Done'))
      .catch(err => console.error('❌ [installUpgrade] Failed:', err));

    toast({
      title: 'Установка выполнена',
      description: `Здание обновлено до уровня ${upgrade.targetLevel}`
    });
  };

  const getUpgradeProgress = (buildingId: string) => {
    const upgrade = activeUpgrades.find(u => u.buildingId === buildingId);
    if (!upgrade) return null;
    if (upgrade.status === 'ready') {
      return { progress: 100, remainingTime: 0, targetLevel: upgrade.targetLevel };
    }
    const elapsed = Date.now() - upgrade.startTime;
    return {
      progress: Math.min(100, (elapsed / upgrade.duration) * 100),
      remainingTime: Math.max(0, upgrade.duration - elapsed),
      targetLevel: upgrade.targetLevel
    };
  };

  const isUpgrading = (buildingId: string) =>
    activeUpgrades.some(u => u.buildingId === buildingId);

  const formatRemainingTime = (milliseconds: number) => {
    const totalMinutes = Math.ceil(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  };

  return {
    startUpgrade,
    startUpgradeAtomic: async (
      buildingId: string,
      duration: number,
      targetLevel: number,
      resourcePatch: { wood?: number; stone?: number; iron?: number; gold?: number; balance?: number }
    ) => {
      const upgrade: UpgradeProgress = {
        buildingId,
        startTime: Date.now(),
        duration: duration * 60 * 1000,
        targetLevel,
        status: 'in_progress'
      };
      const newUpgrades = [...activeUpgrades, upgrade];
      setActiveUpgrades(newUpgrades);
      syncToCache(newUpgrades, resourcePatch);
      try {
        await gameState.actions.batchUpdate({
          ...resourcePatch,
          activeBuildingUpgrades: newUpgrades
        });
        console.log('✅ [startUpgradeAtomic] Saved');
      } catch (error) {
        console.error('❌ [startUpgradeAtomic] Failed:', error);
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
