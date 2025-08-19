import { Item } from "@/types/inventory";

export interface PlayerStats {
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
}

export interface StatusEffect {
  type: 'poison' | 'slow' | 'invisible';
  duration: number;
  value?: number;
}

export interface SpecialAbility {
  type: 'lifesteal' | 'slow_attack' | 'poison_bite' | 'summon' | 'corpse_feed' | 'invisibility' | 'illusion' | 'curse' | 'dark_magic';
  cooldown?: number;
  currentCooldown?: number;
  value?: number;
}

export interface Opponent {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  isBoss?: boolean;
  image?: string;
  statusEffects?: StatusEffect[];
  specialAbilities?: SpecialAbility[];
  isIllusion?: boolean;
  originalId?: number;
}

export interface BattleState {
  level: number;
  coins: number;
  isPlayerTurn: boolean;
  playerStats: PlayerStats;
  opponents: Opponent[];
  inventory: Item[];
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  accessory?: Item;
}