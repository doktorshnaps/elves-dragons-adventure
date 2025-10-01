import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBalanceState } from '@/hooks/useBalanceState';
import { useGameData } from '@/hooks/useGameData';
import { MarketplaceListing } from '@/components/game/marketplace/types';

/**
 * Hook for managing marketplace state and listings
 */
export const useMarketplaceState = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { balance } = useBalanceState();
  const { toast } = useToast();
  const { loadGameData, updateGameData } = useGameData();

  // Load listings from database
  useEffect(() => {
    const loadListings = async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: MarketplaceListing[] = data.map((row: any) => ({
          id: row.id,
          type: row.type,
          item: row.item,
          price: row.price,
          sellerId: row.seller_id,
          createdAt: row.created_at,
        }));
        setListings(mapped);
      }
    };

    loadListings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public:marketplace_listings')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'marketplace_listings' 
      }, () => loadListings())
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'marketplace_listings' 
      }, () => loadListings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Remove listing from local state
  const removeListing = (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
  };

  // Remove multiple listings
  const removeListings = (listingIds: string[]) => {
    const idsSet = new Set(listingIds);
    setListings(prev => prev.filter(l => !idsSet.has(l.id)));
  };

  // Sync local caches from database
  const syncLocalCaches = async (userId: string) => {
    const { data: gd } = await supabase
      .from('game_data')
      .select('inventory,cards,balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (gd) {
      localStorage.setItem('gameInventory', JSON.stringify(gd.inventory || []));
      localStorage.setItem('gameCards', JSON.stringify(gd.cards || []));
      
      const newBalance = (gd as any).balance;
      if (typeof newBalance === 'number') {
        localStorage.setItem('gameBalance', String(newBalance));
        window.dispatchEvent(new CustomEvent('balanceUpdate', { 
          detail: { balance: newBalance } 
        }));
      }

      window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
        detail: { inventory: gd.inventory || [] } 
      }));
      
      window.dispatchEvent(new CustomEvent('cardsUpdate', { 
        detail: { cards: gd.cards || [] } 
      }));

      await loadGameData();
    }
  };

  return {
    listings,
    selectedIds,
    balance,
    toast,
    toggleSelect,
    clearSelection,
    removeListing,
    removeListings,
    syncLocalCaches,
    updateGameData,
    loadGameData
  };
};
