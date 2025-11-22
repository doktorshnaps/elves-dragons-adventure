import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopInventoryItem {
  id: string;
  item_id: number;
  available_quantity: number;
  last_reset_time: string;
  next_reset_time: string;
}

export const useShopInventory = () => {
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  const resettingRef = useRef(false);

   const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_inventory')
        .select('*')
        .order('item_id');

      if (error) throw error;

      setInventory(data || []);
      
      // Если инвентарь пустой — инициируем сброс и повторную загрузку
      if (!data || data.length === 0) {
        await triggerResetAndRefresh();
        return;
      }
      
      // Вычисляем время до сброса из первого элемента
      const nextReset = new Date(data[0].next_reset_time).getTime();
      const now = new Date().getTime();
      setTimeUntilReset(Math.max(0, nextReset - now));
    } catch (error) {
      console.error('Error fetching shop inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (itemId: number, walletAddress: string, quantity: number = 1) => {
    try {
      const { data, error } = await supabase.functions.invoke('shop-purchase', {
        body: { item_id: itemId, wallet_address: walletAddress, quantity }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Обновляем локальное состояние
      setInventory(prev => 
        prev.map(item => 
          item.item_id === itemId 
            ? { ...item, available_quantity: data.remaining_quantity }
            : item
        )
      );

      return data;
    } catch (error) {
      console.error('Error purchasing item:', error);
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

  const triggerResetAndRefresh = async () => {
    if (resettingRef.current) return;
    try {
      resettingRef.current = true;
      const { error } = await supabase.functions.invoke('shop-reset', { body: {} });
      if (error) throw error;
    } catch (error) {
      console.error('Error triggering shop reset:', error);
    } finally {
      await fetchInventory();
      resettingRef.current = false;
    }
  };

  useEffect(() => {
    fetchInventory();

    // Обновляем таймер каждую секунду на основе next_reset_time из БД
    const timerInterval = setInterval(async () => {
      // Перевычисляем время на основе next_reset_time из inventory
      if (inventory.length > 0) {
        const nextReset = new Date(inventory[0].next_reset_time).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, nextReset - now);
        
        setTimeUntilReset(remaining);
        
        // Если время вышло, вызываем сброс только один раз
        if (remaining === 0 && !resettingRef.current) {
          await triggerResetAndRefresh();
        }
      }
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [inventory]);

  return {
    inventory,
    loading,
    timeUntilReset: formatTimeUntilReset(),
    purchaseItem,
    getItemQuantity,
    isItemAvailable,
    refreshInventory: fetchInventory
  };
};