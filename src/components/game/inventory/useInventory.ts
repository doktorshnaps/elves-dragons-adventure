import { useState, useEffect } from "react";
import { Item } from "@/components/battle/Inventory";

export const useInventory = (initialInventory: Item[]) => {
  const [inventory, setInventory] = useState(initialInventory);

  useEffect(() => {
    const handleInventoryUpdate = (e: CustomEvent<{ inventory: Item[] }>) => {
      setInventory(e.detail.inventory);
    };

    const handleStorageChange = () => {
      const savedInventory = localStorage.getItem('gameInventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      }
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return inventory;
};