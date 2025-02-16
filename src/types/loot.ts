
export interface LootTable {
  common: LootItem[];
  rare: LootItem[];
  epic: LootItem[];
}

export interface LootItem {
  id: string;
  name: string;
  type: "material" | "equipment" | "consumable";
  rarity: "common" | "rare" | "epic";
  value: number;
  image?: string;
  dropChance: number;
}
