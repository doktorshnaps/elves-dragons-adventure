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
        .not('item_template_id', 'is', null);

      if (error) throw error;

      return new Set(
        (data || [])
          .map(event => event.item_template_id)
          .filter((id): id is number => id !== null)
      );
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
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
