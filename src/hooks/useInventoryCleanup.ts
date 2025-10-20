import { useEffect, useRef } from 'react';
import { useGameData } from './useGameData';

/**
 * Хук для очистки рабочих из inventory (они должны быть только в card_instances)
 */
export const useInventoryCleanup = () => {
  const { gameData, updateGameData } = useGameData();
  const hasCleanedRef = useRef(false);

  useEffect(() => {
    const cleanupWorkers = async () => {
      // Выполняем очистку только один раз за сессию
      if (hasCleanedRef.current) return;
      
      const inventory = gameData.inventory || [];
      const hasWorkers = inventory.some(item => item?.type === 'worker');
      
      if (hasWorkers) {
        console.log('🧹 Cleaning up workers from inventory...');
        const cleanedInventory = inventory.filter(item => item?.type !== 'worker');
        
        await updateGameData({ inventory: cleanedInventory });
        console.log(`✅ Cleaned ${inventory.length - cleanedInventory.length} workers from inventory`);
        hasCleanedRef.current = true;
      }
    };

    if (gameData.inventory) {
      cleanupWorkers();
    }
  }, [gameData.inventory, updateGameData]);

  return null;
};
