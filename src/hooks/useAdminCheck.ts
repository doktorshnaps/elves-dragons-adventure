import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useAdminCheck = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !accountId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Use RPC to bypass RLS and check role by wallet
        const { data, error } = await supabase.rpc('is_admin_or_super_wallet', {
          p_wallet_address: accountId,
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [accountId, isConnected]);

  return { isAdmin, loading };
};
