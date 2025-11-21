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

      // Check if open access is enabled
      const { data: shopSettings, error: settingsError } = await supabase
        .rpc('get_shop_settings');

      if (!settingsError && shopSettings && shopSettings.length > 0) {
        const settings = shopSettings[0];
        if (settings.is_open_access) {
          // Open access is enabled, grant access to everyone
          return true;
        }
      }

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
