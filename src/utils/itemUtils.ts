import { Item } from "@/components/battle/Inventory";
import { lootItems } from "@/utils/lootUtils";

export const getItemPrice = (item: Item): number => {
  const basePrice = Object.values(lootItems).find(
    lootItem => lootItem.name === item.name
  )?.price || 0;
  
  return Math.floor(basePrice * 0.7); // 70% of original price
};

export const canUpgradeItems = (items: Item[]): boolean => {
  const groupedItems = items.reduce<Record<string, Item[]>>((acc, item) => {
    const key = `${item.name}-${item.type}-${item.value}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  return Object.values(groupedItems).some(group => group.length >= 2);
};

export const upgradeItems = (items: Item[], itemsToUpgrade: Item[]): Item[] => {
  if (itemsToUpgrade.length !== 2) return items;
  
  const [item1, item2] = itemsToUpgrade;
  if (item1.name !== item2.name || item1.type !== item2.type || item1.value !== item2.value) {
    return items;
  }

  const upgradedItem: Item = {
    id: Date.now(),
    name: `Улучшенный ${item1.name}`,
    type: item1.type,
    value: Math.floor(item1.value * 1.5) // 50% boost to stats
  };

  return [
    ...items.filter(item => item.id !== item1.id && item.id !== item2.id),
    upgradedItem
  ];
};