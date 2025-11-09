import { useCallback, useEffect } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { globalBatchManager, resourceBatcher, balanceBatcher, useAutoFlush } from '@/utils/batchingManager';

/**
 * Хук для работы с игровым состоянием через батчинг
 * Оптимизирует частые обновления баланса и ресурсов
 */
export const useBatchedGameState = () => {
  const gameState = useUnifiedGameState();
  
  // Настраиваем обработчик батчей
  useEffect(() => {
    globalBatchManager.setUpdateHandler(async (updates) => {
      console.log('🔄 Executing batched updates:', updates);
      return await gameState.actions.batchUpdate(updates);
    });
  }, [gameState.actions]);
  
  // Синхронизируем текущий баланс с батчером
  useEffect(() => {
    balanceBatcher.setCurrentBalance(gameState.balance);
  }, [gameState.balance]);
  
  // Автоматический flush при размонтировании
  useAutoFlush();
  
  // Батчированные действия
  const batchedActions = {
    /**
     * Обновляет баланс с батчингом
     */
    updateBalance: useCallback((amount: number) => {
      const change = amount - gameState.balance;
      balanceBatcher.addChange(change);
    }, [gameState.balance]),
    
    /**
     * Добавляет к балансу с батчингом
     */
    addBalance: useCallback((amount: number) => {
      balanceBatcher.addChange(amount);
    }, []),
    
    /**
     * Вычитает из баланса с батчингом
     */
    subtractBalance: useCallback((amount: number) => {
      balanceBatcher.addChange(-amount);
    }, []),
    
    /**
     * Обновляет дерево с debouncing
     */
    updateWood: useCallback((amount: number) => {
      resourceBatcher.updateResource('wood', amount);
    }, []),
    
    /**
     * Обновляет камень с debouncing
     */
    updateStone: useCallback((amount: number) => {
      resourceBatcher.updateResource('stone', amount);
    }, []),
    
    /**
     * Обновляет несколько ресурсов одновременно
     */
    updateResources: useCallback((resources: {
      wood?: number;
      stone?: number;
    }) => {
      if (resources.wood !== undefined) resourceBatcher.updateResource('wood', resources.wood);
      if (resources.stone !== undefined) resourceBatcher.updateResource('stone', resources.stone);
    }, []),
    
    /**
     * Немедленно отправляет все накопленные обновления
     */
    flush: useCallback(async () => {
      await Promise.all([
        globalBatchManager.flush(),
        resourceBatcher.flush(),
        balanceBatcher.flush()
      ]);
    }, []),
    
    /**
     * Обычные действия без батчинга (для редких операций)
     */
    ...gameState.actions
  };
  
  return {
    ...gameState,
    actions: batchedActions
  };
};
