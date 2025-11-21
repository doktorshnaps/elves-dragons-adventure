import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useAdmin } from '@/contexts/AdminContext';

interface WhitelistContextType {
  isWhitelisted: boolean;
  loading: boolean;
}

const WhitelistContext = createContext<WhitelistContextType | undefined>(undefined);

export const WhitelistProvider = ({ children }: { children: ReactNode }) => {
  const { accountId } = useWalletContext();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const isConnected = !!accountId;

  const { data: isWhitelisted = false, isLoading: loading } = useQuery({
    queryKey: ['whitelistCheck', accountId, isAdmin],
    queryFn: async () => {
      if (!isConnected || !accountId) return false;
      
      // Admin always has access
      if (isAdmin) return true;

      // Check standard whitelist
      const { data, error } = await supabase.rpc('is_whitelisted', {
        p_wallet_address: accountId,
      });

      if (error) {
        console.error('Error checking whitelist status:', error);
        return false;
      }

      return Boolean(data);
    },
    enabled: isConnected && !!accountId && !adminLoading,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - whitelist rarely changes
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <WhitelistContext.Provider value={{ isWhitelisted, loading }}>
      {children}
    </WhitelistContext.Provider>
  );
};

export const useWhitelistContext = () => {
  const context = useContext(WhitelistContext);
  if (context === undefined) {
    throw new Error('useWhitelistContext must be used within WhitelistProvider');
  }
  return context;
};
