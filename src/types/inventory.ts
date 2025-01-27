export type ItemType = "cardPack" | "healthPotion" | "defensePotion" | "weapon" | "armor" | "dragon_egg";

export type ItemEffect = {
  stat: 'health' | 'power' | 'defense';
  value: number;
  duration?: number;
};

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  value: number;
  effect?: ItemEffect;
  description?: string;
  image?: string;
  petName?: string;
}