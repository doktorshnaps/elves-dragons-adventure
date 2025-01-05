import { Item } from "@/components/battle/Inventory";

export interface LootTable {
  healthPotion: number;
  defensePotion: number;
  weapon: number;
  armor: number;
  coins: {
    chance: number;
    min: number;
    max: number;
  };
}

export const generateLootTable = (isBoss: boolean): LootTable => {
  if (isBoss) {
    return {
      healthPotion: 0.8, // 80% шанс
      defensePotion: 0.7, // 70% шанс
      weapon: 0.6, // 60% шанс
      armor: 0.6, // 60% шанс
      coins: {
        chance: 1, // 100% шанс
        min: 50,
        max: 100
      }
    };
  }

  return {
    healthPotion: 0.3, // 30% шанс
    defensePotion: 0.2, // 20% шанс
    weapon: 0.15, // 15% шанс
    armor: 0.15, // 15% шанс
    coins: {
      chance: 0.7, // 70% шанс
      min: 10,
      max: 30
    }
  };
};

export const rollLoot = (lootTable: LootTable): { items: Item[], coins: number } => {
  const items: Item[] = [];
  let nextId = Date.now();

  if (Math.random() < lootTable.healthPotion) {
    items.push({
      id: nextId++,
      name: "Зелье здоровья",
      type: "healthPotion",
      value: 30
    });
  }

  if (Math.random() < lootTable.defensePotion) {
    items.push({
      id: nextId++,
      name: "Зелье защиты",
      type: "defensePotion",
      value: 20
    });
  }

  if (Math.random() < lootTable.weapon) {
    items.push({
      id: nextId++,
      name: "Меч воина",
      type: "weapon",
      value: 15
    });
  }

  if (Math.random() < lootTable.armor) {
    items.push({
      id: nextId++,
      name: "Броня воина",
      type: "armor",
      value: 10
    });
  }

  const coins = Math.random() < lootTable.coins.chance
    ? Math.floor(Math.random() * (lootTable.coins.max - lootTable.coins.min + 1)) + lootTable.coins.min
    : 0;

  return { items, coins };
};

export const formatDropChance = (chance: number): string => {
  return `${(chance * 100).toFixed(0)}%`;
};