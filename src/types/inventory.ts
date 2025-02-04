export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "defensePotion" | "dragon_egg" | "weapon" | "armor" | "accessory";
  value: number;
  description?: string;
  image?: string;
  petName?: string;
  stats?: {
    power?: number;
    defense?: number;
    health?: number;
  };
  equipped?: boolean;
  slot?: "head" | "chest" | "hands" | "legs" | "feet" | "neck" | "ring1" | "ring2" | "weapon" | "offhand";
}