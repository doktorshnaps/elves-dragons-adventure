import { Item } from "@/types/inventory";
import { PlayerStats } from "@/types/battle";

export const getItemPrice = (item: Item): number => {
  switch (item.type) {
    case "healthPotion":
      return 100;
    case "cardPack":
      return 1000;
    default:
      return 0;
  }
};

export const canUpgradeItems = (items: Item[]): boolean => {
  return false;
};

export const upgradeItems = (items: Item[], itemsToUpgrade: Item[]): Item[] => {
  return items;
};

export const applyItemEffect = (item: Item, playerStats: PlayerStats): PlayerStats => {
  const newStats = { ...playerStats };

  switch (item.name) {
    case "Зелье здоровья":
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      return {
        ...newStats,
        health: Math.floor(newHealth)
      };
    
    case "Зелье защиты":
      return {
        ...newStats,
        defense: newStats.defense + item.value
      };
    
    case "Старый железный меч":
      return {
        ...newStats,
        power: newStats.power + item.value
      };
    
    case "Кожаная броня":
      return {
        ...newStats,
        defense: newStats.defense + item.value
      };
    
    default:
      return newStats;
  }
};