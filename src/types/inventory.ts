export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "defensePotion" | "dragon_egg" | "weapon" | "armor" | "accessory" | "worker" | "woodChunks" | "magicalRoots" | "rockStones" | "blackCrystals" | "illusionManuscript" | "darkMonocle" | "etherVine" | "dwarvenTongs" | "healingOil" | "shimmeringCrystal";
  value: number;
  description?: string;
  image?: string;
  petName?: string;
  stats?: {
    power?: number;
    defense?: number;
    health?: number;
    workDuration?: number; // для рабочих - время работы в миллисекундах
  };
  equipped?: boolean;
  slot?: "head" | "chest" | "hands" | "legs" | "feet" | "neck" | "ring1" | "ring2" | "weapon" | "offhand";
}