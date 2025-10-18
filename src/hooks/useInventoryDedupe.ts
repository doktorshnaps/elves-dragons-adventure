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

      // Создаем Set для отслеживания уникальных ID
      // ВАЖНО: Для рабочих считаем дубликатами ТОЛЬКО совпадающий instanceId.
      // Рабочие без instanceId всегда считаются уникальными (по одному на запись).
      const seenIds = new Set<string>();
      const uniqueItems: Item[] = [];
      const duplicates: Item[] = [];

      inventory.forEach((item: any) => {
        // Обработка рабочих отдельно
        if (item?.type === 'worker') {
          const workerInstanceId = item.instanceId; // не используем fallback на id, т.к. у одинаковых типов он общий
          if (!workerInstanceId) {
            // Нет instanceId — это уникальная запись рабочего
            uniqueItems.push(item);
            return;
          }
          if (seenIds.has(workerInstanceId)) {
            duplicates.push(item);
          } else {
            seenIds.add(workerInstanceId);
            uniqueItems.push(item);
          }
          return;
        }

        // Для прочих предметов используем instanceId или id
        const itemId = item.instanceId || item.id;
        if (!itemId) {
          uniqueItems.push(item);
          return;
        }

        if (seenIds.has(itemId)) {
          duplicates.push(item);
        } else {
          seenIds.add(itemId);
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
