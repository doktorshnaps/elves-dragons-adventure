import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface BanStatusContextType {
  isBanned: boolean;
  loading: boolean;
}

const BanStatusContext = createContext<BanStatusContextType | undefined>(undefined);

export const BanStatusProvider = ({ children }: { children: ReactNode }) => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;

  const { data: isBanned = false, isLoading: loading } = useQuery({
    queryKey: ['banStatus', accountId],
    queryFn: async () => {
      if (!isConnected || !accountId) return false;

      const { data, error } = await supabase.rpc('is_user_banned', {
        p_wallet_address: accountId,
      });

      if (error) {
        console.error('Error checking ban status:', error);
        return false;
      }

      return Boolean(data);
    },
    enabled: isConnected && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <BanStatusContext.Provider value={{ isBanned, loading }}>
      {children}
    </BanStatusContext.Provider>
  );
};

export const useBanStatusContext = () => {
  const context = useContext(BanStatusContext);
  if (context === undefined) {
    throw new Error('useBanStatusContext must be used within BanStatusProvider');
  }
  return context;
};
