import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useTreasureHuntItems = () => {
  const queryClient = useQueryClient();

  const { data: questItemTemplateIds = new Set<number>(), isLoading: loading } = useQuery({
    queryKey: ['treasureHuntItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treasure_hunt_events')
        .select('item_template_id')
        .eq('is_active', true) // ⚠️ ОПТИМИЗАЦИЯ: загружаем только активные события
        .not('item_template_id', 'is', null);

      if (error) {
        // Если ошибка или нет данных, возвращаем пустой Set
        console.log('ℹ️ [useTreasureHuntItems] No active treasure hunt events');
        return new Set<number>();
      }

      const itemIds = new Set(
        (data || [])
          .map(event => event.item_template_id)
          .filter((id): id is number => id !== null)
      );
      
      if (itemIds.size > 0) {
        console.log('✅ [useTreasureHuntItems] Loaded quest item IDs:', Array.from(itemIds));
      }
      
      return itemIds;
    },
    staleTime: 1000 * 60 * 30, // 30 минут (агрессивный кеш для минимизации запросов во время боя)
    gcTime: 1000 * 60 * 60, // 1 час
    refetchOnMount: false, // Не перезагружать при монтировании если данные свежие
    refetchOnWindowFocus: false, // Не перезагружать при фокусе окна
  });

  const isQuestItem = useCallback((templateId?: number | null): boolean => {
    if (!templateId) return false;
    return questItemTemplateIds.has(templateId);
  }, [questItemTemplateIds]);

  return {
    questItemTemplateIds,
    isQuestItem,
    loading
  };
};
