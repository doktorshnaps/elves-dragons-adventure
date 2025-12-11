import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ShopInventoryItem {
  id: string;
  item_id: number;
  available_quantity: number;
  last_reset_time: string;
  next_reset_time: string;
}

export const useShopRealtime = () => {
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  const resettingRef = useRef(false);
  const nextResetTimeRef = useRef<number>(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_inventory')
        .select('*')
        .order('item_id');

      if (error) throw error;

      setInventory(data || []);
      
      if (data && data.length > 0) {
        const nextReset = new Date(data[0].next_reset_time).getTime();
        nextResetTimeRef.current = nextReset;
        
        const now = new Date().getTime();
        setTimeUntilReset(Math.max(0, nextReset - now));
      }
    } catch (error) {
      console.error('[useShopRealtime] Error fetching shop inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Secure two-step purchase:
   * 1. Create a session token (server validates wallet exists and has balance)
   * 2. Execute purchase using session token (server extracts wallet from DB, not request)
   */
  const purchaseItem = async (itemId: number, walletAddress: string, quantity: number = 1) => {
    try {
      // Step 1: Create a secure shop session
      console.log('[useShopRealtime] Creating shop session...');
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-shop-session', {
        body: { 
          wallet_address: walletAddress, 
          item_id: itemId, 
          quantity 
        }
      });

      if (sessionError) {
        console.error('[useShopRealtime] Session error:', sessionError);
        throw new Error('Ошибка создания сессии покупки. Попробуйте позже.');
      }
      if (!sessionData?.success) {
        const errorCode = sessionData?.code;
        if (errorCode === 'RATE_LIMITED') {
          throw new Error('Слишком много запросов. Подождите немного.');
        }
        throw new Error(sessionData?.error || 'Не удалось создать сессию покупки');
      }

      const sessionToken = sessionData.session_token;
      console.log('[useShopRealtime] Session created, executing purchase...');

      // Step 2: Execute purchase using session token (wallet comes from DB, not request)
      const { data, error } = await supabase.functions.invoke('shop-purchase', {
        body: { session_token: sessionToken }
      });

      if (error) {
        console.error('[useShopRealtime] Purchase error:', error);
        throw new Error('Ошибка при покупке. Попробуйте позже.');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Покупка не удалась');
      }

      console.log('[useShopRealtime] Purchase successful:', data);

      // Real-time subscription will handle inventory update automatically
      return data;
    } catch (error) {
      console.error('[useShopRealtime] Error purchasing item:', error);
      throw error;
    }
  };

  const getItemQuantity = (itemId: number): number => {
    const item = inventory.find(inv => inv.item_id === itemId);
    return item?.available_quantity || 0;
  };

  const isItemAvailable = (itemId: number): boolean => {
    return getItemQuantity(itemId) > 0;
  };

  const formatTimeUntilReset = (): string => {
    if (timeUntilReset <= 0) return '00:00:00';
    
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const triggerResetAndRefresh = async (force: boolean = false) => {
    if (resettingRef.current) return { success: false, message: 'Reset already in progress' };
    try {
      resettingRef.current = true;
      const { data, error } = await supabase.functions.invoke('shop-reset', { 
        body: { force } 
      });
      if (error) throw error;
      
      if (!data?.success) {
        console.log('[useShopRealtime] Shop reset skipped:', data?.message);
        return data;
      }
      
      return data;
    } catch (error) {
      console.error('[useShopRealtime] Error triggering shop reset:', error);
      throw error;
    } finally {
      await fetchInventory();
      resettingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('[useShopRealtime] Initializing shop with Realtime subscription');
    fetchInventory();

    // Setup Realtime subscription for instant updates
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
          console.log('[useShopRealtime] 🔄 Realtime UPDATE received:', payload);
          
          // Update inventory with new data
          setInventory(prev => 
            prev.map(item => 
              item.id === payload.new.id 
                ? payload.new as ShopInventoryItem
                : item
            )
          );

          // Update timer if next_reset_time changed
          if (payload.new.next_reset_time) {
            const nextReset = new Date(payload.new.next_reset_time).getTime();
            nextResetTimeRef.current = nextReset;
            const now = new Date().getTime();
            setTimeUntilReset(Math.max(0, nextReset - now));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useShopRealtime] Subscription status:', status);
      });

    channelRef.current = channel;

    // Timer for countdown UI
    const timerInterval = setInterval(() => {
      if (nextResetTimeRef.current > 0) {
        const now = new Date().getTime();
        const remaining = Math.max(0, nextResetTimeRef.current - now);
        setTimeUntilReset(remaining);
      }
    }, 1000);

    return () => {
      console.log('[useShopRealtime] Cleaning up subscription');
      clearInterval(timerInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    inventory,
    loading,
    timeUntilReset: formatTimeUntilReset(),
    purchaseItem,
    getItemQuantity,
    isItemAvailable,
    refreshInventory: fetchInventory,
    triggerResetAndRefresh
  };
};
