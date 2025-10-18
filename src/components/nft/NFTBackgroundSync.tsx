import { useEffect } from 'react';
import { useNFTCardIntegration } from '@/hooks/useNFTCardIntegration';

// Background component to ensure NFT sync runs globally across routes
export const NFTBackgroundSync = () => {
  const { syncNFTsFromWallet } = useNFTCardIntegration();

  useEffect(() => {
    // Trigger immediate sync on mount
    syncNFTsFromWallet();
    // Safety re-check shortly after to catch late wallet init
    const t = setTimeout(() => syncNFTsFromWallet(), 1500);
    return () => clearTimeout(t);
  }, [syncNFTsFromWallet]);

  return null;
};

export default NFTBackgroundSync;
