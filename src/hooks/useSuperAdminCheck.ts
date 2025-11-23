import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useSuperAdminCheck = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;

  const { data: isSuperAdmin = false, isLoading: loading } = useQuery({
    queryKey: ['superAdminCheck', accountId],
    queryFn: async () => {
      if (!isConnected || !accountId) return false;

      const { data, error } = await supabase.rpc('is_super_admin_wallet', {
        p_wallet_address: accountId,
      });

      if (error) {
        console.error('Error checking super admin status:', error);
        return false;
      }
      
      return Boolean(data);
    },
    enabled: isConnected && !!accountId,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - super admin status rarely changes
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return { isSuperAdmin, loading };
};
