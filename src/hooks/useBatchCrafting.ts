import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CraftingRecipe {
  recipe_id: string;
  quantity: number;
}

interface BatchCraftResult {
  success: boolean;
  total_crafted: number;
  recipes_processed: number;
  message?: string;
}

/**
 * ФАЗА 3: Хук для batch крафта предметов
 * 
 * Позволяет создавать несколько предметов за один запрос к БД,
 * используя RPC функцию craft_multiple_items.
 * 
 * Пример использования:
 * const { craftMultiple, isCrafting } = useBatchCrafting(walletAddress);
 * await craftMultiple([
 *   { recipe_id: '...', quantity: 5, materials: [...] },
 *   { recipe_id: '...', quantity: 3, materials: [...] }
 * ]);
 */
export const useBatchCrafting = (walletAddress: string | null) => {
  const [isCrafting, setIsCrafting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const craftMultiple = async (recipes: CraftingRecipe[]): Promise<BatchCraftResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    if (!recipes || recipes.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Не выбраны рецепты для крафта',
        variant: 'destructive'
      });
      return null;
    }

    setIsCrafting(true);

    try {
      console.log('🔨 [useBatchCrafting] Starting batch craft:', {
        wallet: walletAddress,
        recipes: recipes.length,
        total_items: recipes.reduce((sum, r) => sum + r.quantity, 0)
      });

      const { data, error } = await supabase.rpc('craft_multiple_items', {
        p_wallet_address: walletAddress,
        p_recipes: recipes as any
      });

      if (error) {
        console.error('❌ [useBatchCrafting] RPC error:', error);
        throw error;
      }

      console.log('✅ [useBatchCrafting] Batch craft successful:', data);

      // Инвалидируем кеш для обновления UI (active_workers и инвентарь)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['itemInstances', walletAddress] }),
        queryClient.invalidateQueries({ queryKey: ['gameData', walletAddress] }),
        queryClient.invalidateQueries({ queryKey: ['gameDataByWallet'] }),
        queryClient.invalidateQueries({ queryKey: ['unifiedGameData'] })
      ]);

      const result = data as unknown as BatchCraftResult;

      toast({
        title: 'Крафт завершен!',
        description: `Создано предметов: ${result.total_crafted}`
      });

      return result;

    } catch (error) {
      console.error('❌ [useBatchCrafting] Error:', error);
      toast({
        title: 'Ошибка крафта',
        description: error instanceof Error ? error.message : 'Не удалось создать предметы',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsCrafting(false);
    }
  };

  return {
    craftMultiple,
    isCrafting
  };
};
