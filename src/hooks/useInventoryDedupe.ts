import { useEffect, useRef } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { Item } from '@/types/inventory';

/**
 * Хук для удаления дубликатов из инвентаря
 * Дубликаты определяются по instanceId или id
 */
export const useInventoryDedupe = () => {
  const gameState = useUnifiedGameState();
  const hasDeduped = useRef(false);

  useEffect(() => {
    const dedupeInventory = async () => {
      if (hasDeduped.current || gameState.loading || !gameState.actions) {
        return;
      }

      const inventory = gameState.inventory || [];
      if (inventory.length === 0) return;

      // Создаем Set для отслеживания уникальных instanceId (ТОЛЬКО по instanceId, не по template id)
      const seenInstanceIds = new Set<string>();
      const uniqueItems: Item[] = [];
      const duplicates: Item[] = [];

      inventory.forEach((item: any) => {
        const instanceId = item.instanceId;

        if (!instanceId) {
          // Нет уникального instanceId — НЕ считаем такие предметы дубликатами
          uniqueItems.push(item);
          return;
        }

        if (seenInstanceIds.has(instanceId)) {
          // Это дубликат по instanceId
          duplicates.push(item);
        } else {
          // Первое вхождение
          seenInstanceIds.add(instanceId);
          uniqueItems.push(item);
        }
      });

      if (duplicates.length > 0) {
        console.log('🧹 Found duplicates in inventory:', duplicates.length);
        console.log('Duplicates:', duplicates.map(d => ({ 
          id: (d as any).id, 
          instanceId: (d as any).instanceId, 
          name: d.name, 
          type: d.type 
        })));

        try {
          await gameState.actions.updateInventory(uniqueItems);
          hasDeduped.current = true;
          console.log('✅ Removed duplicates from inventory. Before:', inventory.length, 'After:', uniqueItems.length);
        } catch (error) {
          console.error('❌ Failed to remove duplicates:', error);
        }
      } else {
        hasDeduped.current = true;
      }
    };

    dedupeInventory();
  }, [gameState.inventory?.length, gameState.loading, gameState.actions]);

  return null;
};
