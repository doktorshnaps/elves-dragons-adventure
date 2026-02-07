import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batch-fetch display names for a list of wallet addresses.
 * Returns a map: walletAddress -> displayName (or null if not set).
 */
export const useDisplayNames = (walletAddresses: string[]) => {
  // Deduplicate and filter empty
  const uniqueWallets = [...new Set(walletAddresses.filter(Boolean))];

  const { data: nameMap = {}, isLoading } = useQuery({
    queryKey: ['displayNames', uniqueWallets.sort().join(',')],
    queryFn: async () => {
      if (uniqueWallets.length === 0) return {};
      const { data, error } = await supabase.rpc('get_display_names', {
        p_wallets: uniqueWallets,
      });
      if (error) {
        console.error('Error fetching display names:', error);
        return {};
      }
      return (data as Record<string, string>) || {};
    },
    enabled: uniqueWallets.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const getDisplayName = (wallet: string): string => {
    return nameMap[wallet] || `${wallet.slice(0, 8)}...${wallet.slice(-4)}`;
  };

  return { nameMap, getDisplayName, isLoading };
};
