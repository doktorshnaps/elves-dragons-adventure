import { useState, useEffect, useCallback } from 'react';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { getSawmillProduction, getQuarryProduction, getWarehouseWorkingHours } from '@/config/buildings';

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
  getMaxWoodStorage: () => number;
  getMaxStoneStorage: () => number;
  getWoodProductionProgress: () => number;
  getStoneProductionProgress: () => number;
}

export const useResourceProduction = (): UseResourceProductionReturn => {
  const gameState = useUnifiedGameState();
  
  // Инициализируем время из localStorage или устанавливаем текущее время только если данных нет
  const getInitialTime = (key: string) => {
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved) : Date.now();
  };

  const [woodProduction, setWoodProduction] = useState<ResourceProduction>(() => ({
    lastCollectionTime: getInitialTime('woodLastCollection'),
    isProducing: true,
    isStorageFull: false
  }));
  
  const [stoneProduction, setStoneProduction] = useState<ResourceProduction>(() => ({
    lastCollectionTime: getInitialTime('stoneLastCollection'),
    isProducing: true,
    isStorageFull: false
  }));

  // Синхронизация с localStorage только при изменении данных в хранилище
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'woodLastCollection' && e.newValue) {
        setWoodProduction(prev => ({ ...prev, lastCollectionTime: parseInt(e.newValue!) }));
      }
      if (e.key === 'stoneLastCollection' && e.newValue) {
        setStoneProduction(prev => ({ ...prev, lastCollectionTime: parseInt(e.newValue!) }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Эффект для автоматического обновления состояния производства каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const warehouseLevel = gameState?.buildingLevels?.warehouse || 1;
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

  // Максимальное количество ресурсов в хранилище
  const getMaxWoodStorage = useCallback(() => {
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    const woodPerHour = getTotalWoodPerHour();
    return Math.floor(workingHours * woodPerHour);
  }, [getWarehouseLevel, getTotalWoodPerHour]);

  const getMaxStoneStorage = useCallback(() => {
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    const stonePerHour = getTotalStonePerHour();
    return Math.floor(workingHours * stonePerHour);
  }, [getWarehouseLevel, getTotalStonePerHour]);

  // Расчет готовых ресурсов по системе майнинга
  const getWoodReady = useCallback(() => {
    if (!woodProduction.isProducing || getSawmillLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const woodPerHour = getTotalWoodPerHour();
    const maxStorage = getMaxWoodStorage();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    // Если прошло времени больше чем рабочих часов склада - производство остановлено
    if (timeElapsed >= workingHours) {
      return maxStorage;
    }
    
    // Иначе вычисляем текущее производство
    const produced = Math.floor(timeElapsed * woodPerHour);
    return Math.min(produced, maxStorage);
  }, [woodProduction, getSawmillLevel, getTotalWoodPerHour, getMaxWoodStorage, getWarehouseLevel]);

  const getStoneReady = useCallback(() => {
    if (!stoneProduction.isProducing || getQuarryLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const stonePerHour = getTotalStonePerHour();
    const maxStorage = getMaxStoneStorage();
    const warehouseLevel = getWarehouseLevel();
    const workingHours = getWarehouseWorkingHours(warehouseLevel);
    
    // Если прошло времени больше чем рабочих часов склада - производство остановлено
    if (timeElapsed >= workingHours) {
      return maxStorage;
    }
    
    // Иначе вычисляем текущее производство
    const produced = Math.floor(timeElapsed * stonePerHour);
    return Math.min(produced, maxStorage);
  }, [stoneProduction, getQuarryLevel, getTotalStonePerHour, getMaxStoneStorage, getWarehouseLevel]);

  // Прогресс производства (от 0 до 100)
  const getWoodProductionProgress = useCallback(() => {
    if (getSawmillLevel() === 0) return 0;
    
    const readyWood = getWoodReady();
    const maxStorage = getMaxWoodStorage();
    
    if (maxStorage === 0) return 0;
    return Math.min(100, (readyWood / maxStorage) * 100);
  }, [getWoodReady, getMaxWoodStorage, getSawmillLevel]);

  const getStoneProductionProgress = useCallback(() => {
    if (getQuarryLevel() === 0) return 0;
    
    const readyStone = getStoneReady();
    const maxStorage = getMaxStoneStorage();
    
    if (maxStorage === 0) return 0;
    return Math.min(100, (readyStone / maxStorage) * 100);
  }, [getStoneReady, getMaxStoneStorage, getQuarryLevel]);

  // Сбор древесины
  const collectWood = useCallback(async () => {
    const readyWood = getWoodReady();
    if (readyWood <= 0) return;

    try {
      await gameState.actions.updateResources({ 
        wood: (gameState?.wood || 0) + readyWood 
      });
      
      const now = Date.now();
      setWoodProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
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
      await gameState.actions.updateResources({ 
        stone: (gameState?.stone || 0) + readyStone 
      });
      
      const now = Date.now();
      setStoneProduction(prev => ({ 
        ...prev, 
        lastCollectionTime: now,
        isStorageFull: false,
        isProducing: true
      }));
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
    getMaxWoodStorage,
    getMaxStoneStorage,
    getWoodProductionProgress,
    getStoneProductionProgress
  };
};