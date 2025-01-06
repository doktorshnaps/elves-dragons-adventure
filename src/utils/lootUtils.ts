import { Item } from "@/components/battle/Inventory";

export interface LootTable {
  healthPotion: number;
  largeHealthPotion: number;
  defensePotion: number;
  weapon: number;
  armor: number;
}

export const generateLootTable = (isBoss: boolean): LootTable => {
  if (isBoss) {
    return {
      healthPotion: 0.8,
      largeHealthPotion: 0.6,
      defensePotion: 0.7,
      weapon: 0.5,
      armor: 0.5
    };
  }

  return {
    healthPotion: 0.3,
    largeHealthPotion: 0.15,
    defensePotion: 0.2,
    weapon: 0.1,
    armor: 0.1
  };
};

export const lootItems = {
  healthPotion: {
    name: "Малое зелье здоровья",
    type: "healthPotion" as const,
    value: 30
  },
  largeHealthPotion: {
    name: "Большое зелье здоровья",
    type: "healthPotion" as const,
    value: 70
  },
  defensePotion: {
    name: "Зелье защиты",
    type: "defensePotion" as const,
    value: 20
  },
  weapon: {
    name: "Железный меч",
    type: "weapon" as const,
    value: 15
  },
  armor: {
    name: "Кожаная броня",
    type: "armor" as const,
    value: 10
  }
};

export const rollLoot = (lootTable: LootTable): { items: Item[], coins: number } => {
  const items: Item[] = [];
  let nextId = Date.now();

  if (Math.random() < lootTable.healthPotion) {
    items.push({
      id: nextId++,
      ...lootItems.healthPotion
    });
  }

  if (Math.random() < lootTable.largeHealthPotion) {
    items.push({
      id: nextId++,
      ...lootItems.largeHealthPotion
    });
  }

  if (Math.random() < lootTable.defensePotion) {
    items.push({
      id: nextId++,
      ...lootItems.defensePotion
    });
  }

  if (Math.random() < lootTable.weapon) {
    items.push({
      id: nextId++,
      ...lootItems.weapon
    });
  }

  if (Math.random() < lootTable.armor) {
    items.push({
      id: nextId++,
      ...lootItems.armor
    });
  }

  const coins = Math.floor(Math.random() * 50) + 10;
  
  return { items, coins };
};