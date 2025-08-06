import { useGameData } from './useGameData';
import { Item } from "@/types/inventory";

export const useInventorySync = () => {
  const { gameData, updateGameData, loading } = useGameData();
  
  const inventory = gameData.inventory || [];
  
  const updateInventory = async (newInventory: Item[]) => {
    await updateGameData({ inventory: newInventory });
  };

  return { inventory, updateInventory, loading };
};