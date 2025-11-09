import { useCallback } from 'react';
import { useBatchedGameState } from './useBatchedGameState';
import { useToast } from './use-toast';

/**
 * Хук для оптимизированного сбора ресурсов с батчингом
 * Группирует множественные обновления ресурсов в один запрос
 */
export const useResourceCollection = () => {
  const { actions, wood, stone } = useBatchedGameState();
  const { toast } = useToast();
  
  /**
   * Собирает дерево с батчингом
   */
  const collectWood = useCallback(async (amount: number) => {
    const newAmount = wood + amount;
    actions.updateWood(newAmount);
    
    console.log('🪵 Wood collected (batched):', { old: wood, new: newAmount, collected: amount });
    
    return newAmount;
  }, [wood, actions]);
  
  /**
   * Собирает камень с батчингом
   */
  const collectStone = useCallback(async (amount: number) => {
    const newAmount = stone + amount;
    actions.updateStone(newAmount);
    
    console.log('🪨 Stone collected (batched):', { old: stone, new: newAmount, collected: amount });
    
    return newAmount;
  }, [stone, actions]);
  
  /**
   * Собирает несколько ресурсов одновременно
   */
  const collectMultiple = useCallback(async (resources: {
    wood?: number;
    stone?: number;
  }) => {
    const updates: any = {};
    
    if (resources.wood) {
      updates.wood = wood + resources.wood;
    }
    if (resources.stone) {
      updates.stone = stone + resources.stone;
    }
    
    actions.updateResources(updates);
    
    console.log('📦 Multiple resources collected (batched):', updates);
    
    return updates;
  }, [wood, stone, actions]);
  
  /**
   * Принудительно отправляет все накопленные обновления
   */
  const flushUpdates = useCallback(async () => {
    await actions.flush();
  }, [actions]);
  
  return {
    collectWood,
    collectStone,
    collectMultiple,
    flushUpdates,
    currentWood: wood,
    currentStone: stone
  };
};
