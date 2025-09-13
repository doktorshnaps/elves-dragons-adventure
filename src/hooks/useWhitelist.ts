import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';

export const useWhitelist = () => {
  const { accountId, isConnected } = useWallet();
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkWhitelist = async () => {
      if (!isConnected || !accountId) {
        setIsWhitelisted(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_whitelisted', { p_wallet_address: accountId });

        if (error) {
          console.error('Error checking whitelist:', error);
          setIsWhitelisted(false);
        } else {
          setIsWhitelisted(data);
        }
      } catch (error) {
        console.error('Error checking whitelist:', error);
        setIsWhitelisted(false);
      } finally {
        setLoading(false);
      }
    };

    checkWhitelist();
  }, [accountId, isConnected]);

  return { isWhitelisted, loading };
};