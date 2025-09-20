import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './useWallet';

interface RealTimeSyncOptions {
  onGameDataChange?: (payload: any) => void;
  onMarketplaceChange?: (payload: any) => void;
  onShopInventoryChange?: (payload: any) => void;
  onCardInstanceChange?: (payload: any) => void;
}

export const useRealTimeSync = (options: RealTimeSyncOptions) => {
  const { accountId } = useWallet();

  const setupGameDataChannel = useCallback(() => {
    if (!accountId || !options.onGameDataChange) return null;

    const channel = supabase
      .channel('game-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_data',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('Real-time game data change:', payload);
          options.onGameDataChange?.(payload);
        }
      )
      .subscribe();

    return channel;
  }, [accountId, options.onGameDataChange]);

  const setupMarketplaceChannel = useCallback(() => {
    if (!options.onMarketplaceChange) return null;

    const channel = supabase
      .channel('marketplace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_listings'
        },
        (payload) => {
          console.log('Real-time marketplace change:', payload);
          options.onMarketplaceChange?.(payload);
        }
      )
      .subscribe();

    return channel;
  }, [options.onMarketplaceChange]);

  const setupShopInventoryChannel = useCallback(() => {
    if (!options.onShopInventoryChange) return null;

    const channel = supabase
      .channel('shop-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shop_inventory'
        },
        (payload) => {
          console.log('Real-time shop inventory change:', payload);
          options.onShopInventoryChange?.(payload);
        }
      )
      .subscribe();

    return channel;
  }, [options.onShopInventoryChange]);

  const setupCardInstanceChannel = useCallback(() => {
    if (!accountId || !options.onCardInstanceChange) return null;

    const channel = supabase
      .channel('card-instance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('Real-time card instance change:', payload);
          options.onCardInstanceChange?.(payload);
        }
      )
      .subscribe();

    return channel;
  }, [accountId, options.onCardInstanceChange]);

  useEffect(() => {
    if (!accountId) return; // Не подписываемся без кошелька
    
    const channels = [
      setupGameDataChannel(),
      setupMarketplaceChannel(),
      setupShopInventoryChannel(),
      setupCardInstanceChannel()
    ].filter(Boolean);

    return () => {
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [accountId]); // Используем только accountId как зависимость

  // Функция для принудительной синхронизации
  const forceSync = useCallback(async () => {
    // Эта функция будет реализована в основном хуке
    console.log('Force sync requested');
  }, []);

  return { forceSync };
};