import { useState, useEffect, useCallback } from 'react';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { getSawmillProduction, getQuarryProduction, getWarehouseWorkingHours } from '@/config/buildings';
import { supabase } from '@/integrations/supabase/client';

interface ResourceProduction {
  lastCollectionTime: number;
  isProducing: boolean;
  isStorageFull: boolean;
}

interface UseResourceProductionReturn {
  woodProduction: ResourceProduction;
  stoneProduction: ResourceProduction;
  collectWood: () => Promise<void>;
  collectStone: () => Promise<void>;
  getWoodReady: (hasWorkers?: boolean) => number;
  getStoneReady: (hasWorkers?: boolean) => number;
  getTotalWoodPerHour: () => number;
  getTotalStonePerHour: () => number;
  getWoodProductionProgress: (hasWorkers?: boolean) => number;
  getStoneProductionProgress: (hasWorkers?: boolean) => number;
}

export const useResourceProduction = (): UseResourceProductionReturn => {
  const gameState = useUnifiedGameState();
  
  // Инициализируем время из БД или localStorage в качестве fallback
  const getInitialWoodTime = () => {
    const dbTime = gameState?.woodLastCollectionTime ?? 0;
    const saved = localStorage.getItem('woodLastCollection');
    const localTime = saved ? parseInt(saved) : 0;
    const now = Date.now();
    
    // Если есть время из БД или localStorage, используем максимальное (но не из будущего)
    if (dbTime > 0 || localTime > 0) {
      const maxTime = Math.max(dbTime, localTime);
      return maxTime <= now ? maxTime : now - 3600000; // Если время в будущем, ставим час назад
    }
    
    // Если нет времени - ставим час назад для начала производства
    return now - 3600000;
  };

  const getInitialStoneTime = () => {
    const dbTime = gameState?.stoneLastCollectionTime ?? 0;
    const saved = localStorage.getItem('stoneLastCollection');
    const localTime = saved ? parseInt(saved) : 0;
    const now = Date.now();
    
    // Если есть время из БД или localStorage, используем максимальное (но не из будущего)
    if (dbTime > 0 || localTime > 0) {
      const maxTime = Math.max(dbTime, localTime);
      return maxTime <= now ? maxTime : now - 3600000; // Если время в будущем, ставим час назад
    }
    
    // Если нет времени - ставим час назад для начала производства
    return now - 3600000;
  };

  const [woodProduction, setWoodProduction] = useState<ResourceProduction>(() => ({
    lastCollectionTime: getInitialWoodTime(),
    isProducing: gameState?.woodProductionData?.isProducing ?? true,
    isStorageFull: gameState?.woodProductionData?.isStorageFull ?? false
  }));
  
  const [stoneProduction, setStoneProduction] = useState<ResourceProduction>(() => ({
    lastCollectionTime: getInitialStoneTime(),
    isProducing: gameState?.stoneProductionData?.isProducing ?? true,
    isStorageFull: gameState?.stoneProductionData?.isStorageFull ?? false
  }));

  // Синхронизация состояния с БД при изменении gameState
  useEffect(() => {
    if (gameState?.woodLastCollectionTime && gameState.woodLastCollectionTime > 0) {
      setWoodProduction(prev => {
        // Только обновляем если время из БД новее локального
        if (gameState.woodLastCollectionTime! > prev.lastCollectionTime) {
          console.log('🪵 Syncing wood production from DB:', gameState.woodLastCollectionTime);
          return {
            ...prev, 
            lastCollectionTime: gameState.woodLastCollectionTime!,
            isProducing: gameState.woodProductionData?.isProducing ?? true,
            isStorageFull: gameState.woodProductionData?.isStorageFull ?? false
          };
        }
        return prev;
      });
    }
    
    if (gameState?.stoneLastCollectionTime && gameState.stoneLastCollectionTime > 0) {
      setStoneProduction(prev => {
        // Только обновляем если время из БД новее локального
        if (gameState.stoneLastCollectionTime! > prev.lastCollectionTime) {
          console.log('🪨 Syncing stone production from DB:', gameState.stoneLastCollectionTime);
          return {
            ...prev, 
            lastCollectionTime: gameState.stoneLastCollectionTime!,
            isProducing: gameState.stoneProductionData?.isProducing ?? true,
            isStorageFull: gameState.stoneProductionData?.isStorageFull ?? false
          };
        }
        return prev;
      });
    }
  }, [gameState?.woodLastCollectionTime, gameState?.stoneLastCollectionTime, gameState?.woodProductionData, gameState?.stoneProductionData]);

  // Проверка назначенных рабочих
  const hasWorkersInSawmill = useCallback(() => {
    return gameState?.activeWorkers?.some((worker: any) => worker.assignedBuilding === 'sawmill') || false;
  }, [gameState?.activeWorkers]);

  const hasWorkersInQuarry = useCallback(() => {
    return gameState?.activeWorkers?.some((worker: any) => worker.assignedBuilding === 'quarry') || false;
  }, [gameState?.activeWorkers]);

  // Эффект для автоматического обновления состояния производства каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const warehouseLevel = gameState?.buildingLevels?.storage || 1;
      const workingHours = getWarehouseWorkingHours(warehouseLevel);
      
      // Обновляем состояние лесопилки только если есть рабочие
      if (getSawmillLevel() > 0 && hasWorkersInSawmill()) {
        const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600;
        const isStorageFull = timeElapsed >= workingHours;
        setWoodProduction(prev => ({
          ...prev,
          isStorageFull,
          isProducing: !isStorageFull
        }));
      } else {
        // Если нет рабочих - останавливаем производство
        setWoodProduction(prev => ({
          ...prev,
          isProducing: false
        }));
      }
      
      // Обновляем состояние каменоломни только если есть рабочие
      if (getQuarryLevel() > 0 && hasWorkersInQuarry()) {
        const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600;
        const isStorageFull = timeElapsed >= workingHours;
        setStoneProduction(prev => ({
          ...prev,
          isStorageFull,
          isProducing: !isStorageFull
        }));
      } else {
        // Если нет рабочих - останавливаем производство
        setStoneProduction(prev => ({
          ...prev,
          isProducing: false
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [woodProduction.lastCollectionTime, stoneProduction.lastCollectionTime, gameState?.buildingLevels, hasWorkersInSawmill, hasWorkersInQuarry]);

  // Получение уровня зданий
  const getSawmillLevel = useCallback(() => {
    return gameState?.buildingLevels?.sawmill || 0;
  }, [gameState?.buildingLevels?.sawmill]);

  const getQuarryLevel = useCallback(() => {
    return gameState?.buildingLevels?.quarry || 0;
  }, [gameState?.buildingLevels?.quarry]);

  const getWarehouseLevel = useCallback(() => {
    return gameState?.buildingLevels?.storage || 1; // Исправлено на storage
  }, [gameState?.buildingLevels?.storage]);

  // Получение производительности в час
  const getTotalWoodPerHour = useCallback(() => {
    const sawmillLevel = getSawmillLevel();
    console.log('🏭 Wood production debug:', { sawmillLevel, production: getSawmillProduction(sawmillLevel) });
    return getSawmillProduction(sawmillLevel);
  }, [getSawmillLevel]);

  const getTotalStonePerHour = useCallback(() => {
    const quarryLevel = getQuarryLevel();
    console.log('🏭 Stone production debug:', { quarryLevel, production: getQuarryProduction(quarryLevel) });
    return getQuarryProduction(quarryLevel);
  }, [getQuarryLevel]);

  // Удалено - больше нет лимитов хранения

  // Расчет готовых ресурсов без лимитов хранения
  const getWoodReady = useCallback((hasWorkers?: boolean) => {
    const workersAssigned = hasWorkers ?? hasWorkersInSawmill();
    if (!workersAssigned || getSawmillLevel() === 0) {
      console.log('🪵 Wood production stopped - no workers or building:', { workersAssigned, level: getSawmillLevel() });
      return 0;
    }
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const woodPerHour = getTotalWoodPerHour();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    console.log('🪵 Wood production calculation:', {
      timeElapsed,
      woodPerHour,
      workingHours,
      lastCollectionTime: new Date(woodProduction.lastCollectionTime).toLocaleString()
    });
    
    // Если прошло времени больше чем рабочих часов склада - возвращаем максимум за рабочие часы
    if (timeElapsed >= workingHours) {
      const result = Math.floor(workingHours * woodPerHour);
      console.log('🪵 Max wood ready (storage full):', result);
      return result;
    }
    
    // Иначе вычисляем текущее производство
    const result = Math.floor(timeElapsed * woodPerHour);
    console.log('🪵 Current wood ready:', result);
    return result;
  }, [woodProduction.lastCollectionTime, getSawmillLevel, getTotalWoodPerHour, getWarehouseLevel]);

  const getStoneReady = useCallback((hasWorkers?: boolean) => {
    const workersAssigned = hasWorkers ?? hasWorkersInQuarry();
    if (!workersAssigned || getQuarryLevel() === 0) {
      console.log('🪨 Stone production stopped - no workers or building:', { workersAssigned, level: getQuarryLevel() });
      return 0;
    }
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const stonePerHour = getTotalStonePerHour();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    console.log('🪨 Stone production calculation:', {
      timeElapsed,
      stonePerHour,
      workingHours,
      lastCollectionTime: new Date(stoneProduction.lastCollectionTime).toLocaleString()
    });
    
    // Если прошло времени больше чем рабочих часов склада - возвращаем максимум за рабочие часы
    if (timeElapsed >= workingHours) {
      const result = Math.floor(workingHours * stonePerHour);
      console.log('🪨 Max stone ready (storage full):', result);
      return result;
    }
    
    // Иначе вычисляем текущее производство
    const result = Math.floor(timeElapsed * stonePerHour);
    console.log('🪨 Current stone ready:', result);
    return result;
  }, [stoneProduction.lastCollectionTime, getQuarryLevel, getTotalStonePerHour, getWarehouseLevel]);

  // Прогресс производства (от 0 до 100) на основе времени работы склада
  const getWoodProductionProgress = useCallback((hasWorkers?: boolean) => {
    const workersAssigned = hasWorkers ?? hasWorkersInSawmill();
    if (!workersAssigned || getSawmillLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600;
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    return Math.min(100, (timeElapsed / workingHours) * 100);
  }, [woodProduction.lastCollectionTime, getSawmillLevel, getWarehouseLevel, hasWorkersInSawmill]);

  const getStoneProductionProgress = useCallback((hasWorkers?: boolean) => {
    const workersAssigned = hasWorkers ?? hasWorkersInQuarry();
    if (!workersAssigned || getQuarryLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600;
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    return Math.min(100, (timeElapsed / workingHours) * 100);
  }, [stoneProduction.lastCollectionTime, getQuarryLevel, getWarehouseLevel, hasWorkersInQuarry]);

  // Функция для сохранения состояния производства в БД
  const saveProductionStateToDB = async (resource: 'wood' | 'stone', lastCollectionTime: number, isProducing: boolean, isStorageFull: boolean) => {
    try {
      const walletAddress = localStorage.getItem('wallet');
      if (!walletAddress) return;
      
      await supabase.rpc('update_resource_production_state_by_wallet', {
        p_wallet_address: walletAddress,
        p_resource: resource,
        p_last_collection_time: lastCollectionTime,
        p_is_producing: isProducing,
        p_is_storage_full: isStorageFull
      });
    } catch (error) {
      console.error(`Error saving ${resource} production state:`, error);
    }
  };

  // Сбор древесины
  const collectWood = useCallback(async () => {
    const readyWood = getWoodReady(true); // Предполагаем что рабочие есть, если функция вызвана
    console.log('🪵 collectWood called - readyWood:', readyWood);
    if (readyWood <= 0) return;

    try {
      // Обновляем время ПЕРЕД обновлением ресурсов
      const now = Date.now();
      console.log('🪵 collectWood executing - time:', now);
      
      // Обновляем локальное состояние сразу
      setWoodProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
      
      // Сохраняем в БД
      await saveProductionStateToDB('wood', now, true, false);

      // Обновляем глобальный gameState, чтобы при ремонте не терять время сбора
      await gameState.actions.batchUpdate({
        woodLastCollectionTime: now,
        woodProductionData: { isProducing: true, isStorageFull: false }
      } as any);
      
      // Затем обновляем ресурсы
      await gameState.actions.updateResources({ 
        wood: (gameState?.wood || 0) + readyWood 
      });
      
      // Fallback в localStorage
      localStorage.setItem('woodLastCollection', now.toString());
      console.log('🪵 collectWood completed successfully');
    } catch (error) {
      console.error('Ошибка при сборе древесины:', error);
    }
  }, [getWoodReady, gameState?.wood, gameState.actions]);

  // Сбор камня
  const collectStone = useCallback(async () => {
    const readyStone = getStoneReady(true); // Предполагаем что рабочие есть, если функция вызвана
    console.log('🪨 collectStone called - readyStone:', readyStone);
    if (readyStone <= 0) return;

    try {
      // Обновляем время ПЕРЕД обновлением ресурсов
      const now = Date.now();
      console.log('🪨 collectStone executing - time:', now);
      
      // Обновляем локальное состояние сразу
      setStoneProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
      
      // Сохраняем в БД
      await saveProductionStateToDB('stone', now, true, false);

      // Обновляем глобальный gameState
      await gameState.actions.batchUpdate({
        stoneLastCollectionTime: now,
        stoneProductionData: { isProducing: true, isStorageFull: false }
      } as any);
      
      // Затем обновляем ресурсы
      await gameState.actions.updateResources({ 
        stone: (gameState?.stone || 0) + readyStone 
      });
      
      // Fallback в localStorage
      localStorage.setItem('stoneLastCollection', now.toString());
      console.log('🪨 collectStone completed successfully');
    } catch (error) {
      console.error('Ошибка при сборе камня:', error);
    }
  }, [getStoneReady, gameState?.stone, gameState.actions]);

  return {
    woodProduction,
    stoneProduction,
    collectWood,
    collectStone,
    getWoodReady,
    getStoneReady,
    getTotalWoodPerHour,
    getTotalStonePerHour,
    getWoodProductionProgress,
    getStoneProductionProgress
  };
};