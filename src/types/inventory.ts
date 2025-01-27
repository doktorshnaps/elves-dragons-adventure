export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "dragon_egg";
  value: number;
  description?: string;
  image?: string;
  petName?: string;
}