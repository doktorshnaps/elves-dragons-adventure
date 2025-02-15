
import { Item } from "@/types/inventory";

export interface Monster {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  reward: number;
  experienceReward: number;
  type: 'normal' | 'elite' | 'boss';
  position: number; // Changed from optional to required
}

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
