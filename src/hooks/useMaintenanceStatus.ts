import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceStatus {
  is_enabled: boolean;
  message: string;
}

export const useMaintenanceStatus = () => {
  return useQuery<MaintenanceStatus>({
    queryKey: ['maintenanceStatus'],
    queryFn: async () => {
      console.log('🔍 [MaintenanceStatus] Checking maintenance status...');
      try {
        const { data, error } = await supabase.rpc('get_maintenance_status');
        
        if (error) {
          console.error('❌ [MaintenanceStatus] Error fetching:', error);
          return { is_enabled: false, message: '' };
        }
        
        const result = {
          is_enabled: (data as any)?.is_enabled || false,
          message: (data as any)?.message || ''
        };
        console.log('✅ [MaintenanceStatus] Result:', result);
        return result;
      } catch (err) {
        console.error('❌ [MaintenanceStatus] Exception:', err);
        return { is_enabled: false, message: '' };
      }
    },
    staleTime: 15 * 60 * 1000, // 15 минут
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: true, // ИСПРАВЛЕНО: разрешаем первую загрузку
    refetchOnWindowFocus: false,
    retry: 1, // Уменьшено для быстрого fallback
    retryDelay: 500,
  });
};
