
import { Item } from "@/types/inventory";

export interface LootTable {
  coins: {
    chance: number;
    min: number;
    max: number;
  };
  healthPotion?: {
    chance: number;
  };
}

export const generateLootTable = (isBoss: boolean): LootTable => {
  if (isBoss) {
    return {
      coins: {
        chance: 1,
        min: 50,
        max: 100
      },
      healthPotion: {
        chance: 0.3
      }
    };
  }

  return {
    coins: {
      chance: 0.7,
      min: 10,
      max: 30
    },
    healthPotion: {
      chance: 0.1
    }
  };
};

export const formatDropChance = (chance: number): string => {
  return `${(chance * 100).toFixed(0)}%`;
};

export const generateLoot = (lootTable: LootTable): { items: Item[], coins: number } => {
  const items: Item[] = [];
  
  const coins = Math.random() < lootTable.coins.chance
    ? Math.floor(Math.random() * (lootTable.coins.max - lootTable.coins.min + 1)) + lootTable.coins.min
    : 0;

  if (lootTable.healthPotion && Math.random() < lootTable.healthPotion.chance) {
    items.push({
      id: Date.now().toString(),
      type: "healthPotion",
      name: "Малое зелье здоровья",
      value: 50
    });
  }
  
  return { items, coins };
};
