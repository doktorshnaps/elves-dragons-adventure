
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
      // Check if event detail exists and has inventory property
      if (e.detail && e.detail.inventory) {
        setInventory(e.detail.inventory);
        localStorage.setItem('gameInventory', JSON.stringify(e.detail.inventory));
      } else {
        // If no detail.inventory, try to get latest from localStorage
        const savedInventory = localStorage.getItem('gameInventory');
        if (savedInventory) {
          const newInventory = JSON.parse(savedInventory);
          setInventory(newInventory);
        }
      }
    };

    const handleStorageChange = () => {
      const savedInventory = localStorage.getItem('gameInventory');
      if (savedInventory) {
        const newInventory = JSON.parse(savedInventory);
        setInventory(newInventory);
      }
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Добавляем интервал для периодической проверки изменений
    const syncInterval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  const updateInventory = (newInventory: Item[]) => {
    setInventory(newInventory);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    const event = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(event);
  };

  return { inventory, updateInventory };
};
