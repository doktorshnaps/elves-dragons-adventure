import { Item } from "@/types/inventory";

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