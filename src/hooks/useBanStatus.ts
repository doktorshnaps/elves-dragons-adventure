import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useBanStatus = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const [isBanned, setIsBanned] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!isConnected || !accountId) {
        setIsBanned(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_user_banned', { p_wallet_address: accountId });

        if (error) {
          console.error('Error checking ban status:', error);
          setIsBanned(false);
        } else {
          setIsBanned(data);
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
        setIsBanned(false);
      } finally {
        setLoading(false);
      }
    };

    checkBanStatus();
  }, [accountId, isConnected]);

  return { isBanned, loading };
};