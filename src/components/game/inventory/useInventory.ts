import { useState, useEffect } from 'react';
import { Item } from "@/types/inventory";
import { useGameStore } from "@/stores/gameStore";

export const useInventory = (initialInventory: Item[]) => {
  const storeInventory = useGameStore((state) => state.inventory);
  const [inventory, setInventory] = useState(storeInventory.length > 0 ? storeInventory : initialInventory);

  // Синхронизируем с store
  useEffect(() => {
    if (storeInventory.length > 0) {
      setInventory(storeInventory);
    }
  }, [storeInventory]);

  return inventory;
};
