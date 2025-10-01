import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from '@/components/game/marketplace/types';

/**
 * Hook for marketplace purchase and listing operations
 */
export const useMarketplaceOperations = () => {
  /**
   * Create a new marketplace listing
   */
  const createListing = async (
    listing: MarketplaceListing,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    
    if (!userId) {
      onError('Требуется вход');
      return;
    }

    const { error } = await (supabase as any).rpc('create_marketplace_listing', {
      p_listing_type: listing.type,
      p_item_id: (listing.item as any).id,
      p_price: listing.price,
    });

    if (error) {
      onError(error.message);
      return;
    }

    onSuccess();
  };

  /**
   * Cancel a marketplace listing
   */
  const cancelListing = async (
    listingId: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    
    if (!userId) {
      onError('Требуется вход');
      return;
    }

    const { error } = await (supabase as any).rpc('cancel_marketplace_listing', {
      p_listing_id: listingId,
    });

    if (error) {
      onError(error.message);
      return;
    }

    onSuccess();
  };

  /**
   * Purchase a single listing
   */
  const purchaseListing = async (
    listingId: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    const { error } = await (supabase as any).rpc('process_marketplace_purchase', {
      listing_id: listingId,
    });

    if (error) {
      onError(error.message);
      return false;
    }

    onSuccess();
    return true;
  };

  /**
   * Ensure purchased item is in local state
   */
  const ensurePurchaseApplied = async (
    userId: string,
    listing: MarketplaceListing,
    updateGameData: any
  ) => {
    const purchasedId = (listing.item as any)?.id;
    if (!purchasedId) return;

    const { data: gd } = await supabase
      .from('game_data')
      .select('inventory,cards')
      .eq('user_id', userId)
      .maybeSingle();

    if (listing.type === 'card') {
      const cards = ((gd?.cards as any[]) || []);
      const hasCard = cards.some((c: any) => c?.id === purchasedId);
      
      if (!hasCard) {
        console.warn('[Marketplace] Card missing after purchase, patching locally', { 
          purchasedId, 
          listingId: listing.id 
        });
        
        const patched = [...cards, listing.item as any];
        await updateGameData({ cards: patched });
        localStorage.setItem('gameCards', JSON.stringify(patched));
        window.dispatchEvent(new CustomEvent('cardsUpdate', { 
          detail: { cards: patched } 
        }));
      }
    } else {
      const inventory = ((gd?.inventory as any[]) || []);
      const hasItem = inventory.some((it: any) => it?.id === purchasedId);
      
      if (!hasItem) {
        console.warn('[Marketplace] Item missing after purchase, patching locally', { 
          purchasedId, 
          listingId: listing.id 
        });
        
        const patched = [...inventory, listing.item as any];
        await updateGameData({ inventory: patched as any });
        localStorage.setItem('gameInventory', JSON.stringify(patched));
        window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
          detail: { inventory: patched } 
        }));
      }
    }
  };

  return {
    createListing,
    cancelListing,
    purchaseListing,
    ensurePurchaseApplied
  };
};
