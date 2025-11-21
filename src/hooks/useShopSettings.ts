import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ShopSettings {
  id: string;
  items_per_refresh: number;
  refresh_interval_hours: number;
  is_open_access: boolean;
  created_at: string;
  updated_at: string;
}

export const useShopSettings = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: async (): Promise<ShopSettings | null> => {
      const { data, error } = await supabase
        .rpc('get_shop_settings');

      if (error) {
        console.error('Error fetching shop settings:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data[0] as ShopSettings;
      }

      // Return default settings if none exist
      return {
        id: '',
        items_per_refresh: 50,
        refresh_interval_hours: 24,
        is_open_access: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    settings: data,
    loading: isLoading,
    error,
    refetch,
  };
};