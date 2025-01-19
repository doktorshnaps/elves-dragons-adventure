export interface PlayerStats {
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
  experience?: number;
  level?: number;
  requiredExperience?: number;
}

export interface Opponent {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  isBoss?: boolean;
  image?: string;
}

export interface BattleState {
  playerStats: PlayerStats;
  opponents: Opponent[];
  currentDungeonLevel: number;
  selectedDungeon: string | null;
}