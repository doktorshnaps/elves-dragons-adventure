import { useEffect } from 'react';
import { useNFTCardIntegration } from '@/hooks/useNFTCardIntegration';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';

// Background component to ensure NFT sync runs globally across routes
export const NFTBackgroundSync = () => {
  const { syncNFTsFromWallet } = useNFTCardIntegration();
  const { accountId, nearAccountId } = useWalletContext();

  useEffect(() => {
    // Trigger immediate sync on mount
    syncNFTsFromWallet();
    // Safety re-check shortly after to catch late wallet init
    const t = setTimeout(() => syncNFTsFromWallet(), 1500);
    return () => clearTimeout(t);
  }, [syncNFTsFromWallet]);

  // Pre-warm whitelist NFT access check when wallet connects
  useEffect(() => {
    const wallet = accountId || nearAccountId;
    if (!wallet) return;

    const refreshWhitelistAccess = async () => {
      try {
        console.log('🔄 [NFTBackgroundSync] Pre-warming whitelist access for:', wallet);
        await supabase.functions.invoke('refresh-wallet-whitelist-access', {
          body: { wallet_address: wallet },
        });
      } catch (err) {
        console.error('❌ [NFTBackgroundSync] whitelist access refresh failed:', err);
      }
    };

    refreshWhitelistAccess();
  }, [accountId, nearAccountId]);

  return null;
};

export default NFTBackgroundSync;
