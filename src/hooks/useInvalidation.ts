import { useQueryClient } from '@tanstack/react-query';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useMemo } from 'react';
import { 
  createInvalidator, 
  InvalidationPreset,
  invalidateByPreset,
  invalidateMultiplePresets,
  invalidateSelective 
} from '@/utils/invalidationPresets';

/**
 * Хук для централизованной инвалидации кэша React Query
 * 
 * @example
 * const invalidate = useInvalidation();
 * 
 * // После покупки в магазине
 * await invalidate.afterShopPurchase();
 * 
 * // После боя
 * await invalidate.afterBattle();
 * 
 * // Селективная инвалидация
 * await invalidate.selective({ cardInstances: true, gameData: true });
 * 
 * // Несколько пресетов
 * await invalidate.multiple(['afterBattle', 'afterItemUse']);
 */
export function useInvalidation() {
  const queryClient = useQueryClient();
  const { accountId } = useWalletContext();
  
  const invalidator = useMemo(() => {
    if (!accountId) {
      // Return no-op functions if no wallet connected
      return {
        afterShopPurchase: async () => console.warn('No wallet connected'),
        afterBattle: async () => console.warn('No wallet connected'),
        afterCraft: async () => console.warn('No wallet connected'),
        afterCardPackOpen: async () => console.warn('No wallet connected'),
        afterHeroUpgrade: async () => console.warn('No wallet connected'),
        afterItemUse: async () => console.warn('No wallet connected'),
        afterMedicalBay: async () => console.warn('No wallet connected'),
        afterForgeBay: async () => console.warn('No wallet connected'),
        afterResourceCollection: async () => console.warn('No wallet connected'),
        afterBuildingUpgrade: async () => console.warn('No wallet connected'),
        afterTeamChange: async () => console.warn('No wallet connected'),
        afterBalanceChange: async () => console.warn('No wallet connected'),
        afterLogout: async () => console.warn('No wallet connected'),
        selective: async () => console.warn('No wallet connected'),
        multiple: async () => console.warn('No wallet connected'),
        
        // Raw methods for edge cases
        byPreset: async () => console.warn('No wallet connected'),
        byPresets: async () => console.warn('No wallet connected'),
      };
    }
    
    const base = createInvalidator(queryClient, accountId);
    
    return {
      ...base,
      // Raw methods for advanced usage
      byPreset: (preset: InvalidationPreset) => 
        invalidateByPreset(queryClient, accountId, preset),
      byPresets: (presets: InvalidationPreset[]) => 
        invalidateMultiplePresets(queryClient, accountId, presets),
    };
  }, [queryClient, accountId]);
  
  return invalidator;
}

/**
 * Статические утилиты для использования вне React-компонентов
 * (например, в edge functions или callbacks)
 */
export const InvalidationUtils = {
  invalidateByPreset,
  invalidateMultiplePresets,
  invalidateSelective,
};
