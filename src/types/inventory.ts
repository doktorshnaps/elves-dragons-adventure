export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "dragon_egg" | "weapon" | "armor" | "accessory";
  value: number;
  description?: string;
  image?: string;
  petName?: string;
  stats?: {
    power?: number;
    defense?: number;
    health?: number;
  };
}