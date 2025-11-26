import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalItemStat {
  item_name: string;
  item_type: string;
  total_found: number;
  template_id: number;
}

export const useGlobalItemStats = () => {
  return useQuery({
    queryKey: ['globalItemStats'],
    queryFn: async () => {
      console.log('🔄 [GlobalItemStats] Fetching global item statistics...');
      
      const { data, error } = await supabase
        .rpc('get_global_item_stats');
      
      if (error) {
        console.error('❌ [GlobalItemStats] Error fetching item stats:', error);
        throw error;
      }
      
      console.log(`✅ [GlobalItemStats] Fetched ${data?.length || 0} item stats`);
      return (data || []) as GlobalItemStat[];
    },
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
