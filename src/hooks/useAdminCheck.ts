import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useAdminCheck = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;

  // Используем React Query для кэширования запросов админ статуса
  const { data: isAdmin = false, isLoading: loading } = useQuery({
    queryKey: ['adminCheck', accountId],
    queryFn: async () => {
      if (!isConnected || !accountId) return false;

      const { data, error } = await supabase.rpc('is_admin_or_super_wallet', {
        p_wallet_address: accountId,
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return Boolean(data);
    },
    enabled: isConnected && !!accountId,
    staleTime: 60 * 60 * 1000, // 1 час - админ статус меняется очень редко
    gcTime: 2 * 60 * 60 * 1000, // 2 часа
  });

  return { isAdmin, loading };
};
