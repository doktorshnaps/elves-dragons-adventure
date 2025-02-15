
import { Item } from "@/types/inventory";

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  accessory?: Item;
}

export interface PlayerStats {
  power: number;
  defense: number;
  maxHealth: number;
}
