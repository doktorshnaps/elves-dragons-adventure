import { Item } from "@/types/inventory";

export const getItemPrice = (item: Item): number => {
  switch (item.type) {
    case "healthPotion":
      return Math.floor(item.value * 2);
    case "cardPack":
      return 1000;
    case "weapon":
    case "armor":
    case "accessory":
      return Math.floor(item.value * 300);
    default:
      return 0;
  }
};

export const canEquipItem = (item: Item): boolean => {
  return ["weapon", "armor", "accessory"].includes(item.type);
};

export const getEquipmentSlot = (item: Item): Item['slot'] | undefined => {
  switch (item.type) {
    case "weapon":
      return "weapon";
    case "armor":
      if (item.slot) return item.slot;
      return "chest";
    case "accessory":
      if (item.slot) return item.slot;
      return "neck";
    default:
      return undefined;
  }
};

export const calculateEquipmentStats = (equippedItems: Item[]) => {
  return equippedItems.reduce((stats, item) => {
    if (item.stats) {
      return {
        power: (stats.power || 0) + (item.stats.power || 0),
        defense: (stats.defense || 0) + (item.stats.defense || 0),
        health: (stats.health || 0) + (item.stats.health || 0),
      };
    }
    return stats;
  }, { power: 0, defense: 0, health: 0 });
};