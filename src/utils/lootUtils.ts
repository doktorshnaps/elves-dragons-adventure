import { Item } from "@/components/battle/Inventory";

export interface LootTable {
  coins: {
    chance: number;
    min: number;
    max: number;
  };
}

export const generateLootTable = (isBoss: boolean): LootTable => {
  if (isBoss) {
    return {
      coins: {
        chance: 1,
        min: 50,
        max: 100
      }
    };
  }

  return {
    coins: {
      chance: 0.7,
      min: 10,
      max: 30
    }
  };
};

export const lootItems = {};

export const formatDropChance = (chance: number): string => {
  return `${(chance * 100).toFixed(0)}%`;
};

export const rollLoot = (lootTable: LootTable): { items: Item[], coins: number } => {
  const items: Item[] = [];
  
  const coins = Math.random() < lootTable.coins.chance
    ? Math.floor(Math.random() * (lootTable.coins.max - lootTable.coins.min + 1)) + lootTable.coins.min
    : 0;
  
  return { items, coins };
};