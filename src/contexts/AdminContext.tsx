import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;

  const { data: isAdmin = false, isLoading: loading } = useQuery({
    queryKey: ['adminCheck', accountId],
    queryFn: async () => {
      console.log('🔍 [AdminContext] Checking admin status for:', accountId);
      if (!isConnected || !accountId) {
        console.log('⚠️ [AdminContext] No accountId, returning false');
        return false;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin_or_super_wallet', {
          p_wallet_address: accountId,
        });

        if (error) {
          console.error('❌ [AdminContext] Error checking admin status:', error);
          return false;
        }
        
        const result = Boolean(data);
        console.log('✅ [AdminContext] Admin check result:', result);
        return result;
      } catch (err) {
        console.error('❌ [AdminContext] Exception checking admin status:', err);
        return false;
      }
    },
    enabled: isConnected && !!accountId,
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
