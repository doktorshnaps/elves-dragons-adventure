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
      const { data, error } = await supabase.rpc('get_maintenance_status');
      
      if (error) {
        console.error('Error fetching maintenance status:', error);
        return { is_enabled: false, message: '' };
      }
      
      return {
        is_enabled: (data as any)?.is_enabled || false,
        message: (data as any)?.message || ''
      };
    },
    staleTime: 10 * 60 * 1000, // 10 минут - может меняться админом
    gcTime: 30 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // Автообновление каждые 10 минут
  });
};
