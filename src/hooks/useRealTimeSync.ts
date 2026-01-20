import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface RealTimeSyncOptions {
  // РЕФАКТОРИНГ: Удалены дублирующиеся подписки
  // onGameDataChange - используется в GameDataContext.tsx
  // onCardInstanceChange - используется в useCardInstances.ts  
  // onShopInventoryChange - используется в useShopRealtime.ts
  onMarketplaceChange?: (payload: any) => void;
}

export const useRealTimeSync = (options: RealTimeSyncOptions) => {
  const { accountId } = useWalletContext();

  // РЕФАКТОРИНГ Phase 5.1: Удалены дублирующиеся подписки
  // game_data: подписка есть в GameDataContext.tsx
  // card_instances: подписка есть в useCardInstances.ts
  // shop_inventory: подписка есть в useShopRealtime.ts
  // 
  // Этот хук теперь используется только для централизованного управления
  // подписками на таблицы, которые НЕ имеют собственных провайдеров

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

  useEffect(() => {
    const channels = [
      setupMarketplaceChannel()
    ].filter(Boolean);

    return () => {
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [setupMarketplaceChannel]);

  // Функция для принудительной синхронизации
  const forceSync = useCallback(async () => {
    console.log('Force sync requested');
  }, []);

  return { forceSync };
};