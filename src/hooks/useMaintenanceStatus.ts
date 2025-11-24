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
    staleTime: 15 * 60 * 1000, // 15 минут - может меняться админом
    gcTime: 30 * 60 * 1000,
    refetchInterval: false, // ОТКЛЮЧЕНО автообновление для снижения нагрузки
    refetchOnMount: false, // ОТКЛЮЧЕНО - используем только кеш
    refetchOnWindowFocus: false, // Не перезапрашивать при фокусе окна
    retry: 2,
    retryDelay: 1000,
  });
};
