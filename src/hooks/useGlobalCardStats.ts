import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalCardStat {
  card_name: string;
  card_faction: string;
  total_found: number;
  rarity: number;
}

export const useGlobalCardStats = (cardType: 'character' | 'pet') => {
  const mappedType = cardType === 'pet' ? 'dragon' : 'hero';
  
  return useQuery({
    queryKey: ['globalCardStats', mappedType],
    queryFn: async () => {
      console.log(`🔄 [GlobalCardStats] Fetching global stats for ${mappedType}...`);
      
      const { data, error } = await supabase
        .rpc('get_global_card_stats', { p_card_type: mappedType });
      
      if (error) {
        console.error(`❌ [GlobalCardStats] Error fetching ${mappedType} stats:`, error);
        throw error;
      }
      
      console.log(`✅ [GlobalCardStats] Fetched ${data?.length || 0} ${mappedType} stats`);
      return (data || []) as GlobalCardStat[];
    },
    staleTime: 1000 * 60 * 5, // 5 минут - глобальная статистика меняется не так часто
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
