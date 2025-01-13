import { Item } from "@/components/battle/Inventory";
import { lootItems } from "@/utils/lootUtils";

export const getItemPrice = (item: Item): number => {
  return 0; // Since we only have card packs now, and they can't be sold
};

export const canUpgradeItems = (items: Item[]): boolean => {
  return false; // No upgradeable items anymore
};

export const upgradeItems = (items: Item[], itemsToUpgrade: Item[]): Item[] => {
  return items; // No upgrades available
};