
import { useState, useEffect } from 'react';
import { Item } from "@/types/inventory";
import { useToast } from '@/hooks/use-toast';

export const useInventoryState = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  useEffect(() => {
    const handleInventoryUpdate = (e: CustomEvent) => {
      try {
        if (e.detail && e.detail.inventory) {
          setInventory(e.detail.inventory);
          localStorage.setItem('gameInventory', JSON.stringify(e.detail.inventory));
        }
      } catch (error) {
        console.error('Error handling inventory update:', error);
      }
    };

    const handleStorageChange = () => {
      try {
        const savedInventory = localStorage.getItem('gameInventory');
        if (savedInventory) {
          const newInventory = JSON.parse(savedInventory);
          setInventory(newInventory);
        }
      } catch (error) {
        console.error('Error handling storage change:', error);
      }
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateInventory = (newInventory: Item[]) => {
    try {
      setInventory(newInventory);
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      const event = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить инвентарь",
        variant: "destructive"
      });
    }
  };

  return { inventory, updateInventory };
};
