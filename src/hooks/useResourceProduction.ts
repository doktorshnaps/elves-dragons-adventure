import { useState, useEffect, useCallback } from 'react';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { getSawmillProduction, getQuarryProduction } from '@/config/buildings';

interface ResourceProduction {
  lastCollectionTime: number;
  isProducing: boolean;
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
}

export const useResourceProduction = (): UseResourceProductionReturn => {
  const gameState = useUnifiedGameState();
  
  const [woodProduction, setWoodProduction] = useState<ResourceProduction>({
    lastCollectionTime: Date.now(),
    isProducing: true
  });
  
  const [stoneProduction, setStoneProduction] = useState<ResourceProduction>({
    lastCollectionTime: Date.now(),
    isProducing: true
  });

  // Инициализация времени последнего сбора из локального хранилища
  useEffect(() => {
    const savedWoodTime = localStorage.getItem('woodLastCollection');
    const savedStoneTime = localStorage.getItem('stoneLastCollection');
    
    if (savedWoodTime) {
      setWoodProduction(prev => ({ ...prev, lastCollectionTime: parseInt(savedWoodTime) }));
    }
    
    if (savedStoneTime) {
      setStoneProduction(prev => ({ ...prev, lastCollectionTime: parseInt(savedStoneTime) }));
    }
  }, []);

  // Получение уровня зданий
  const getSawmillLevel = useCallback(() => {
    return gameState?.buildingLevels?.sawmill || 0;
  }, [gameState?.buildingLevels]);

  const getQuarryLevel = useCallback(() => {
    return gameState?.buildingLevels?.quarry || 0;
  }, [gameState?.buildingLevels]);

  // Получение производительности в час
  const getTotalWoodPerHour = useCallback(() => {
    const sawmillLevel = getSawmillLevel();
    return getSawmillProduction(sawmillLevel);
  }, [getSawmillLevel]);

  const getTotalStonePerHour = useCallback(() => {
    const quarryLevel = getQuarryLevel();
    return getQuarryProduction(quarryLevel);
  }, [getQuarryLevel]);

  // Расчет готовых ресурсов
  const getWoodReady = useCallback(() => {
    if (!woodProduction.isProducing || getSawmillLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - woodProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const woodPerHour = getTotalWoodPerHour();
    return Math.floor(timeElapsed * woodPerHour);
  }, [woodProduction, getSawmillLevel, getTotalWoodPerHour]);

  const getStoneReady = useCallback(() => {
    if (!stoneProduction.isProducing || getQuarryLevel() === 0) return 0;
    
    const timeElapsed = (Date.now() - stoneProduction.lastCollectionTime) / 1000 / 3600; // в часах
    const stonePerHour = getTotalStonePerHour();
    return Math.floor(timeElapsed * stonePerHour);
  }, [stoneProduction, getQuarryLevel, getTotalStonePerHour]);

  // Сбор древесины
  const collectWood = useCallback(async () => {
    const readyWood = getWoodReady();
    if (readyWood <= 0) return;

    try {
      await gameState.actions.updateResources({ 
        wood: (gameState?.wood || 0) + readyWood 
      });
      
      const now = Date.now();
      setWoodProduction(prev => ({ ...prev, lastCollectionTime: now }));
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
      setStoneProduction(prev => ({ ...prev, lastCollectionTime: now }));
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
    getTotalStonePerHour
  };
};