export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "cardPack" | "healthPotion" | "defensePotion" | "weapon" | "armor" | "accessory" | "worker" | "material" | "woodChunks" | "magicalRoots" | "rockStones" | "blackCrystals" | "illusionManuscript" | "darkMonocle" | "etherVine" | "dwarvenTongs" | "healingOil" | "shimmeringCrystal" | "lifeCrystal";
  value: number;
  sell_price?: number;
  image?: string;
  stats?: {
    power?: number;
    defense?: number;
    health?: number;
    workDuration?: number; // для рабочих - время работы в миллисекундах
  };
  requiredLevel?: number;
  slot?: "head" | "chest" | "hands" | "legs" | "feet" | "neck" | "ring1" | "ring2" | "weapon" | "offhand";
  equipped?: boolean;
}

export const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Колода карт",
    description: "Содержит 1 случайную карту героя или питомца",
    price: 1,
    type: "cardPack",
    value: 1,
    image: "/lovable-uploads/e523dce0-4cda-4d32-b4e2-ecec40b1eb39.png"
  }
];