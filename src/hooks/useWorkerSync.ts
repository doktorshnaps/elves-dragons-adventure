import { useEffect, useRef } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useCardInstances } from './useCardInstances';
import { supabase } from '@/integrations/supabase/client';

/**
 * Хук для синхронизации рабочих между card_instances и game_data.inventory
 */
export const useWorkerSync = () => {
  const gameState = useUnifiedGameState();
  const { cardInstances } = useCardInstances();
  const syncedInstancesRef = useRef(new Set<string>());

  useEffect(() => {
    const syncWorkers = async () => {
      // Получаем рабочих из card_instances
      const workerInstances = cardInstances.filter(instance => 
        instance.card_type === 'workers' || 
        (instance.card_data && (instance.card_data as any).type === 'worker')
      );

      // Получаем рабочих из инвентаря
      const inventoryWorkers = (gameState.inventory || []).filter(item => item?.type === 'worker' || item?.type === 'workers');
      
      // Создаем Set из instanceId в инвентаре для быстрой проверки
      const inventoryInstanceIds = new Set(
        inventoryWorkers.map(w => w.instanceId || w.id).filter(Boolean)
      );

      // Проверяем, есть ли рабочие в card_instances, которых нет в инвентаре
      const missingInInventory = workerInstances.filter(instance => {
        const instanceId = (instance as any).id;
        // Пропускаем, если уже синхронизирован или есть в инвентаре
        if (syncedInstancesRef.current.has(instanceId)) {
          return false;
        }
        if (inventoryInstanceIds.has(instanceId)) {
          syncedInstancesRef.current.add(instanceId);
          return false;
        }
        return true;
      });

      if (missingInInventory.length > 0) {
        console.log('🔄 Syncing workers from card_instances to inventory:', missingInInventory.length);
        
        // Добавляем недостающих рабочих в инвентарь
        const workersToAdd = missingInInventory.map(instance => {
          const instanceId = (instance as any).id;
          syncedInstancesRef.current.add(instanceId);
          
          return {
            id: instanceId, // уникальный идентификатор экземпляра
            instanceId: instanceId,
            templateId: instance.card_template_id,
            name: (instance.card_data as any).name || 'Рабочий',
            type: 'worker' as const,
            value: (instance.card_data as any).value || 0,
            description: (instance.card_data as any).description || '',
            image: (instance.card_data as any).image,
            stats: (instance.card_data as any).stats || {}
          };
        });

        const updatedInventory = [...(gameState.inventory || []), ...workersToAdd];
        
        try {
          await gameState.actions.updateInventory(updatedInventory);
          console.log('✅ Workers synced to inventory successfully');
        } catch (error) {
          console.error('❌ Failed to sync workers to inventory:', error);
          // Откатываем отметки синхронизации при ошибке
          missingInInventory.forEach(instance => {
            syncedInstancesRef.current.delete((instance as any).id);
          });
        }
      }
    };

    if (cardInstances.length > 0 && !gameState.loading && gameState.actions) {
      syncWorkers();
    }
  }, [cardInstances.length, gameState.loading]); // Убрали gameState.inventory из зависимостей!

  return null;
};