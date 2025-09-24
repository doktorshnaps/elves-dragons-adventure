// Deduplicated game data loading to prevent multiple simultaneous requests
import { supabase } from '@/integrations/supabase/client';

const loadingPromises = new Map<string, Promise<any>>();

export async function loadGameDataDeduped(walletAddress: string): Promise<any[]> {
  if (!walletAddress) throw new Error('wallet address required');
  
  // Return existing promise if already loading
  if (loadingPromises.has(walletAddress)) {
    return await loadingPromises.get(walletAddress)!;
  }
  
  // Create new loading promise
  const loadingPromise = (async () => {
    try {
      console.log('🔄 Loading game data (deduped) for wallet:', walletAddress);
      
      const { data: gameDataArray, error } = await supabase.rpc('get_game_data_by_wallet', {
        p_wallet_address: walletAddress
      });

      if (error) {
        console.error('❌ Error loading game data:', error);
        throw error;
      }

      console.log('✅ Game data loaded successfully (deduped)');
      return gameDataArray || [];
    } finally {
      // Clean up the promise after completion
      loadingPromises.delete(walletAddress);
    }
  })();
  
  // Store the promise
  loadingPromises.set(walletAddress, loadingPromise);
  
  return await loadingPromise;
}

// Clear all pending requests for a wallet (useful when switching wallets)
export function clearPendingLoads(walletAddress?: string) {
  if (walletAddress) {
    loadingPromises.delete(walletAddress);
  } else {
    loadingPromises.clear();
  }
}