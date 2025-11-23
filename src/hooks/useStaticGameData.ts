import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaticGameData {
  building_configs: any[];
  crafting_recipes: any[];
  item_templates: any[];
  card_drop_rates: any[];
  card_upgrade_requirements: any[];
  monsters: any[];
  dungeon_settings: any[];
}

export const useStaticGameData = () => {
  const queryResult = useQuery({
    queryKey: ['staticGameData', 'v2'], // Изменили ключ для принудительной перезагрузки после миграции
    queryFn: async () => {
      console.log('🔄 [StaticGameData] Loading ALL static game data in single request...');
      const startTime = performance.now();
      
      try {
        const { data, error } = await supabase.rpc('get_static_game_data');
        
        if (error) {
          console.error('❌ [StaticGameData] Failed to load:', error);
          throw error;
        }
        
        if (!data || typeof data !== 'object') {
          console.error('❌ [StaticGameData] Invalid data format:', data);
          throw new Error('Invalid data format from get_static_game_data');
        }
        
        const staticData = data as unknown as StaticGameData;
        
        const endTime = performance.now();
        console.log(`✅ [StaticGameData] Loaded in ${(endTime - startTime).toFixed(2)}ms:`, {
          building_configs: staticData.building_configs?.length || 0,
          crafting_recipes: staticData.crafting_recipes?.length || 0,
          item_templates: staticData.item_templates?.length || 0,
          card_drop_rates: staticData.card_drop_rates?.length || 0,
          card_upgrade_requirements: staticData.card_upgrade_requirements?.length || 0,
          monsters: staticData.monsters?.length || 0,
          dungeon_settings: staticData.dungeon_settings?.length || 0,
          firstTemplate: staticData.item_templates?.[0]
        });
        
        return staticData;
      } catch (err) {
        console.error('❌ [StaticGameData] Exception:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 час - данные редко меняются
    gcTime: 1000 * 60 * 120, // 2 часа в памяти
    refetchOnMount: true, // Включаем перезагрузку при монтировании для первой загрузки
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  console.log('🔍 [useStaticGameData] Query state:', {
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    hasData: !!queryResult.data,
    data: queryResult.data
  });

  return queryResult;
};
