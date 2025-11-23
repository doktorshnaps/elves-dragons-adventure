import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CardUpdate {
  card_instance_id: string;
  current_health?: number;
  current_defense?: number;
  monster_kills?: number;
}

interface BatchUpdateResult {
  success: boolean;
  cards_updated: number;
}

/**
 * ФАЗА 3: Хук для batch обновления характеристик карт
 * 
 * Позволяет обновить несколько карт за один запрос к БД,
 * используя RPC функцию batch_update_card_stats.
 * 
 * Особенно полезно для:
 * - Массового лечения карт в медпункте/кузнице
 * - Обновления статов после боя
 * - Административных операций
 * 
 * Пример использования:
 * const { updateMultiple, isUpdating } = useBatchCardUpdate(walletAddress);
 * await updateMultiple([
 *   { card_instance_id: '...', current_health: 100, current_defense: 50 },
 *   { card_instance_id: '...', monster_kills: 10 }
 * ]);
 */
export const useBatchCardUpdate = (walletAddress: string | null) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMultiple = async (
    updates: CardUpdate[]
  ): Promise<BatchUpdateResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    if (!updates || updates.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Нет обновлений для применения',
        variant: 'destructive'
      });
      return null;
    }

    setIsUpdating(true);

    try {
      console.log('📊 [useBatchCardUpdate] Starting batch update:', {
        wallet: walletAddress,
        updates: updates.length
      });

      const { data, error } = await supabase.rpc('batch_update_card_stats', {
        p_wallet_address: walletAddress,
        p_card_updates: updates as any
      });

      if (error) {
        console.error('❌ [useBatchCardUpdate] RPC error:', error);
        throw error;
      }

      console.log('✅ [useBatchCardUpdate] Batch update successful:', data);

      // Инвалидируем кеш карт для обновления UI
      await queryClient.invalidateQueries({ queryKey: ['cardInstances', walletAddress] });
      await queryClient.invalidateQueries({ queryKey: ['gameData', walletAddress] });

      const result = data as unknown as BatchUpdateResult;

      toast({
        title: 'Обновление завершено!',
        description: `Обновлено карт: ${result.cards_updated}`
      });

      return result;

    } catch (error) {
      console.error('❌ [useBatchCardUpdate] Error:', error);
      toast({
        title: 'Ошибка обновления',
        description: error instanceof Error ? error.message : 'Не удалось обновить карты',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateMultiple,
    isUpdating
  };
};
