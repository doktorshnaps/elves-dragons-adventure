import { useEffect, useRef } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { Item } from '@/types/inventory';

/**
 * Хук для удаления дубликатов из инвентаря
 * @deprecated Legacy hook - inventory is now managed via item_instances table
 */
export const useInventoryDedupe = () => {
  // No-op: inventory management moved to item_instances table
  return null;
};
