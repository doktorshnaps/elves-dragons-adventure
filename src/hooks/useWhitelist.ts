import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface UseWhitelistOptions {
  isAdmin?: boolean;
}

export const useWhitelist = (options?: UseWhitelistOptions) => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const isAdmin = options?.isAdmin ?? false;
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkNFTWhitelist = async () => {
    if (!accountId) return false;
    
    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Checking NFT whitelist');
      }
      const { data, error } = await supabase.functions.invoke('check-nft-whitelist', {
        body: { wallet_address: accountId }
      });
      
      if (error) {
        if (import.meta.env.DEV) {
          console.log('⚠️ NFT whitelist check failed:', error);
        }
        return false;
      }
      
      if (data?.addedToWhitelist) {
        if (import.meta.env.DEV) {
          console.log('✅ Added to whitelist via NFT ownership');
        }
        return true;
      }
      
      return false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('⚠️ NFT whitelist check failed:', error);
      }
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const checkWhitelist = async () => {
      if (!isConnected || !accountId) {
        setIsWhitelisted(false);
        setLoading(false);
        return;
      }

      try {
        // Если уже известно, что пользователь админ - пропускаем проверки
        if (isAdmin) {
          setIsWhitelisted(true);
          setLoading(false);
          return;
        }

        // Сначала проверяем обычный вайт-лист
        const { data, error } = await supabase
          .rpc('is_whitelisted', { p_wallet_address: accountId });

        if (cancelled) return;

        if (error) {
          if (import.meta.env.DEV) {
            console.error('Error checking whitelist:', error);
          }
          setIsWhitelisted(false);
        } else if (data) {
          setIsWhitelisted(true);
        } else {
          // Если не в обычном вайт-листе, проверяем NFT (только один раз)
          const nftWhitelisted = await checkNFTWhitelist();
          
          if (cancelled) return;
          
          setIsWhitelisted(nftWhitelisted);
          
          // УДАЛЕНО: повторная проверка через setTimeout - это вызывало бесконечные запросы
        }
      } catch (error) {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.error('Error checking whitelist:', error);
        }
        setIsWhitelisted(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkWhitelist();
    
    return () => {
      cancelled = true;
    };
  }, [accountId, isConnected, isAdmin]);

  return { isWhitelisted, loading };
};