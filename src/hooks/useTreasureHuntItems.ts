import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTreasureHuntItems = () => {
  const [questItemTemplateIds, setQuestItemTemplateIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestItems();

    // Realtime subscription для treasure_hunt_events
    const channel = supabase
      .channel('treasure_hunt_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treasure_hunt_events'
        },
        () => {
          loadQuestItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadQuestItems = async () => {
    try {
      setLoading(true);
      // Загружаем все активные и недавние события
      const { data, error } = await supabase
        .from('treasure_hunt_events')
        .select('item_template_id')
        .not('item_template_id', 'is', null);

      if (error) throw error;

      const templateIds = new Set(
        (data || [])
          .map(event => event.item_template_id)
          .filter((id): id is number => id !== null)
      );

      setQuestItemTemplateIds(templateIds);
    } catch (error) {
      console.error('Error loading treasure hunt items:', error);
    } finally {
      setLoading(false);
    }
  };

  const isQuestItem = (templateId?: number | null): boolean => {
    if (!templateId) return false;
    return questItemTemplateIds.has(templateId);
  };

  return {
    questItemTemplateIds,
    isQuestItem,
    loading
  };
};
