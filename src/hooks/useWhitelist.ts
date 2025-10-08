import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useWhitelist = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkNFTWhitelist = async () => {
    if (!accountId) return false;
    
    try {
      console.log('🔍 Checking NFT whitelist for:', accountId);
      const { data, error } = await supabase.functions.invoke('check-nft-whitelist', {
        body: { wallet_address: accountId }
      });
      
      if (error) {
        console.log('⚠️ NFT whitelist check failed:', error);
        return false;
      }
      
      if (data?.addedToWhitelist) {
        console.log('✅ Added to whitelist via NFT ownership');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('⚠️ NFT whitelist check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkWhitelist = async () => {
      if (!isConnected || !accountId) {
        setIsWhitelisted(false);
        setLoading(false);
        return;
      }

      try {
        // Сначала проверяем обычный вайт-лист
        const { data, error } = await supabase
          .rpc('is_whitelisted', { p_wallet_address: accountId });

        if (error) {
          console.error('Error checking whitelist:', error);
          setIsWhitelisted(false);
        } else if (data) {
          setIsWhitelisted(true);
        } else {
          // Если не в обычном вайт-листе, проверяем NFT
          console.log('🔍 Not in regular whitelist, checking NFT whitelist...');
          const nftWhitelisted = await checkNFTWhitelist();
          setIsWhitelisted(nftWhitelisted);
          
          if (nftWhitelisted) {
            // Принудительно перезагружаем статус после добавления
            setTimeout(async () => {
              const { data: recheck } = await supabase
                .rpc('is_whitelisted', { p_wallet_address: accountId });
              setIsWhitelisted(!!recheck);
            }, 1000);
          }
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