import { EquipmentType } from "./equipment";

export interface ShopItem {
  id: number;
  name: string;
  type: "healthPotion" | "defensePotion" | EquipmentType;
  value: number;
  price: number;
}