import { useEffect } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useCardInstances } from './useCardInstances';
import { supabase } from '@/integrations/supabase/client';

/**
 * Хук для синхронизации рабочих между card_instances и game_data.inventory
 */
export const useWorkerSync = () => {
  const gameState = useUnifiedGameState();
  const { cardInstances } = useCardInstances();

  useEffect(() => {
    const syncWorkers = async () => {
      // Получаем рабочих из card_instances
      const workerInstances = cardInstances.filter(instance => 
        instance.card_type === 'workers' || 
        (instance.card_data && (instance.card_data as any).type === 'worker')
      );

      // Получаем рабочих из инвентаря
      const inventoryWorkers = (gameState.inventory || []).filter(item => item?.type === 'worker');

      // Проверяем, есть ли рабочие в card_instances, которых нет в инвентаре
      const missingInInventory = workerInstances.filter(instance => {
        const workerId = instance.card_template_id;
        return !inventoryWorkers.some(worker => worker.id === workerId);
      });

      if (missingInInventory.length > 0) {
        console.log('🔄 Syncing workers from card_instances to inventory:', missingInInventory.length);
        
        // Добавляем недостающих рабочих в инвентарь
        const workersToAdd = missingInInventory.map(instance => ({
          id: instance.card_template_id,
          name: (instance.card_data as any).name || 'Рабочий',
          type: 'worker' as const,
          value: (instance.card_data as any).value || 0,
          description: (instance.card_data as any).description || '',
          image: (instance.card_data as any).image,
          stats: (instance.card_data as any).stats || {}
        }));

        const updatedInventory = [...(gameState.inventory || []), ...workersToAdd];
        
        try {
          await gameState.actions.updateInventory(updatedInventory);
          console.log('✅ Workers synced to inventory successfully');
        } catch (error) {
          console.error('❌ Failed to sync workers to inventory:', error);
        }
      }
    };

    if (cardInstances.length > 0 && !gameState.loading) {
      syncWorkers();
    }
  }, [cardInstances, gameState.inventory, gameState.loading, gameState.actions]);

  return null;
};