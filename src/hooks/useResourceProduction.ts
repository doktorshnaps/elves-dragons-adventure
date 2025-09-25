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
  getWoodReady: () => number;
  getStoneReady: () => number;
  getTotalWoodPerHour: () => number;
  getTotalStonePerHour: () => number;
  getWoodProductionProgress: () => number;
  getStoneProductionProgress: () => number;
}

export const useResourceProduction = (): UseResourceProductionReturn => {
  const gameState = useUnifiedGameState();
  
  // Инициализируем время из БД или localStorage в качестве fallback
  const getInitialWoodTime = () => {
    if (gameState?.woodLastCollectionTime) {
      return gameState.woodLastCollectionTime;
    }
    const saved = localStorage.getItem('woodLastCollection');
    return saved ? parseInt(saved) : Date.now();
  };

  const getInitialStoneTime = () => {
    if (gameState?.stoneLastCollectionTime) {
      return gameState.stoneLastCollectionTime;
    }
    const saved = localStorage.getItem('stoneLastCollection');
    return saved ? parseInt(saved) : Date.now();
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
    if (gameState?.woodLastCollectionTime) {
      setWoodProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: gameState.woodLastCollectionTime!,
        isProducing: gameState.woodProductionData?.isProducing ?? true,
        isStorageFull: gameState.woodProductionData?.isStorageFull ?? false
      }));
    }
    
    if (gameState?.stoneLastCollectionTime) {
      setStoneProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: gameState.stoneLastCollectionTime!,
        isProducing: gameState.stoneProductionData?.isProducing ?? true,
        isStorageFull: gameState.stoneProductionData?.isStorageFull ?? false
      }));
    }
  }, [gameState?.woodLastCollectionTime, gameState?.stoneLastCollectionTime, gameState?.woodProductionData, gameState?.stoneProductionData]);

  // Эффект для автоматического обновления состояния производства каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const warehouseLevel = gameState?.buildingLevels?.storage || 1;
      const workingHours = getWarehouseWorkingHours(warehouseLevel);
      
      // Обновляем состояние лесопилки
      if (getSawmillLevel() > 0) {
        const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600;
        const isStorageFull = timeElapsed >= workingHours;
        setWoodProduction(prev => ({
          ...prev,
          isStorageFull,
          isProducing: !isStorageFull
        }));
      }
      
      // Обновляем состояние каменоломни
      if (getQuarryLevel() > 0) {
        const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600;
        const isStorageFull = timeElapsed >= workingHours;
        setStoneProduction(prev => ({
          ...prev,
          isStorageFull,
          isProducing: !isStorageFull
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [woodProduction.lastCollectionTime, stoneProduction.lastCollectionTime, gameState?.buildingLevels]);

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
  const getWoodReady = useCallback(() => {
    if (getSawmillLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const woodPerHour = getTotalWoodPerHour();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    // Если прошло времени больше чем рабочих часов склада - возвращаем максимум за рабочие часы
    if (timeElapsed >= workingHours) {
      return Math.floor(workingHours * woodPerHour);
    }
    
    // Иначе вычисляем текущее производство
    return Math.floor(timeElapsed * woodPerHour);
  }, [woodProduction.lastCollectionTime, getSawmillLevel, getTotalWoodPerHour, getWarehouseLevel]);

  const getStoneReady = useCallback(() => {
    if (getQuarryLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const stonePerHour = getTotalStonePerHour();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    // Если прошло времени больше чем рабочих часов склада - возвращаем максимум за рабочие часы
    if (timeElapsed >= workingHours) {
      return Math.floor(workingHours * stonePerHour);
    }
    
    // Иначе вычисляем текущее производство
    return Math.floor(timeElapsed * stonePerHour);
  }, [stoneProduction.lastCollectionTime, getQuarryLevel, getTotalStonePerHour, getWarehouseLevel]);

  // Прогресс производства (от 0 до 100) на основе времени работы склада
  const getWoodProductionProgress = useCallback(() => {
    if (getSawmillLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600;
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    return Math.min(100, (timeElapsed / workingHours) * 100);
  }, [woodProduction.lastCollectionTime, getSawmillLevel, getWarehouseLevel]);

  const getStoneProductionProgress = useCallback(() => {
    if (getQuarryLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600;
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    return Math.min(100, (timeElapsed / workingHours) * 100);
  }, [stoneProduction.lastCollectionTime, getQuarryLevel, getWarehouseLevel]);

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
    const readyWood = getWoodReady();
    if (readyWood <= 0) return;

    try {
      // Обновляем время ПЕРЕД обновлением ресурсов
      const now = Date.now();
      
      // Обновляем локальное состояние сразу
      setWoodProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
      
      // Сохраняем в БД
      await saveProductionStateToDB('wood', now, true, false);
      
      // Затем обновляем ресурсы
      await gameState.actions.updateResources({ 
        wood: (gameState?.wood || 0) + readyWood 
      });
      
      // Fallback в localStorage
      localStorage.setItem('woodLastCollection', now.toString());
    } catch (error) {
      console.error('Ошибка при сборе древесины:', error);
    }
  }, [getWoodReady, gameState?.wood, gameState.actions]);

  // Сбор камня
  const collectStone = useCallback(async () => {
    const readyStone = getStoneReady();
    if (readyStone <= 0) return;

    try {
      // Обновляем время ПЕРЕД обновлением ресурсов
      const now = Date.now();
      
      // Обновляем локальное состояние сразу
      setStoneProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
      
      // Сохраняем в БД
      await saveProductionStateToDB('stone', now, true, false);
      
      // Затем обновляем ресурсы
      await gameState.actions.updateResources({ 
        stone: (gameState?.stone || 0) + readyStone 
      });
      
      // Fallback в localStorage
      localStorage.setItem('stoneLastCollection', now.toString());
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