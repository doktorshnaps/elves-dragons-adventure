import { Item } from "@/components/battle/Inventory";

interface LootTable {
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

interface LootResult {
  items: Item[];
  coins: number;
}

export const generateLootTable = (isBoss: boolean): LootTable => {
  if (isBoss) {
    return {
      healthPotion: 0.8,
      defensePotion: 0.6,
      weapon: 0.5,
      armor: 0.5,
      coins: {
        chance: 1,
        min: 100,
        max: 300
      }
    };
  }

  return {
    healthPotion: 0.3,
    defensePotion: 0.2,
    weapon: 0.1,
    armor: 0.1,
    coins: {
      chance: 0.7,
      min: 10,
      max: 50
    }
  };
};

export const formatDropChance = (chance: number): string => {
  return `${Math.round(chance * 100)}%`;
};

export const rollLoot = (lootTable: LootTable): LootResult => {
  const items: Item[] = [];
  let coins = 0;

  // Roll for health potion
  if (Math.random() < lootTable.healthPotion) {
    if (Math.random() < 0.5) {
      items.push({
        id: Date.now(),
        name: "Малое зелье здоровья",
        type: "healthPotion",
        value: 30,
        image: "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png"
      });
    } else {
      items.push({
        id: Date.now(),
        name: "Большое зелье здоровья",
        type: "healthPotion",
        value: 70,
        image: "/lovable-uploads/194bfe08-75f6-4415-8fda-5538a83251c3.png"
      });
    }
  }

  // Roll for defense potion
  if (Math.random() < lootTable.defensePotion) {
    items.push({
      id: Date.now(),
      name: "Зелье защиты",
      type: "defensePotion",
      value: 20,
      image: "/lovable-uploads/b8a49d16-bf80-4363-90d6-7c244e46ca02.png"
    });
  }

  // Roll for weapon
  if (Math.random() < lootTable.weapon) {
    items.push({
      id: Date.now(),
      name: "Оружие",
      type: "weapon",
      value: 10,
      image: "/lovable-uploads/5b0afe54-887d-46f3-a3d1-2696cb956374.png"
    });
  }

  // Roll for armor
  if (Math.random() < lootTable.armor) {
    items.push({
      id: Date.now(),
      name: "Броня",
      type: "armor",
      value: 5,
      image: "/lovable-uploads/7b41199f-7eca-42a5-a6cc-42711e736f48.png"
    });
  }

  // Roll for coins
  if (Math.random() < lootTable.coins.chance) {
    coins = Math.floor(
      Math.random() * (lootTable.coins.max - lootTable.coins.min + 1) + lootTable.coins.min
    );
  }

  return { items, coins };
};

export const generateLoot = (level: number): Item[] => {
  const loot: Item[] = [];
  const chance = Math.random();

  if (chance < 0.3) {
    if (Math.random() < 0.5) {
      loot.push({
        id: Date.now(),
        name: "Малое зелье здоровья",
        type: "healthPotion",
        value: 30,
        image: "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png"
      });
    } else {
      loot.push({
        id: Date.now(),
        name: "Большое зелье здоровья",
        type: "healthPotion",
        value: 70,
        image: "/lovable-uploads/194bfe08-75f6-4415-8fda-5538a83251c3.png"
      });
    }
  }

  if (level > 2 && Math.random() < 0.2) {
    loot.push({
      id: Date.now(),
      name: "Зелье защиты",
      type: "defensePotion",
      value: 20
    });
  }

  return loot;
};