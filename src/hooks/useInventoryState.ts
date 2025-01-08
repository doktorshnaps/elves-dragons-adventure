import { useState, useEffect } from 'react';
import { Item } from '@/components/battle/Inventory';
import { useToast } from '@/hooks/use-toast';

export const useInventoryState = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  useEffect(() => {
    const handleInventoryUpdate = (e: CustomEvent<{ inventory: Item[] }>) => {
      setInventory(e.detail.inventory);
      localStorage.setItem('gameInventory', JSON.stringify(e.detail.inventory));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameInventory') {
        const newInventory = e.newValue ? JSON.parse(e.newValue) : [];
        setInventory(newInventory);
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
    setInventory(newInventory);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    const event = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(event);
  };

  return { inventory, updateInventory };
};