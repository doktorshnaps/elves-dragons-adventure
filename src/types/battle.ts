import { Item } from "@/components/battle/Inventory";

export interface PlayerStats {
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
}

export interface Opponent {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  isBoss?: boolean;
}

export interface BattleState {
  level: number;
  coins: number;
  isPlayerTurn: boolean;
  playerStats: PlayerStats;
  opponents: Opponent[];
  inventory: Item[];
}