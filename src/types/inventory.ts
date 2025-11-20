export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "defensePotion" | "dragon_egg" | "weapon" | "armor" | "accessory" | "worker" | "material" | "woodChunks" | "magicalRoots" | "rockStones" | "blackCrystals" | "illusionManuscript" | "darkMonocle" | "etherVine" | "dwarvenTongs" | "healingOil" | "shimmeringCrystal" | "lifeCrystal";
  value: number;
  sell_price?: number;
  description?: string;
  image?: string;
  image_url?: string; // URL from database
  template_id?: number; // Template ID for treasure hunt items
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