export type ElementType = 'nature' | 'earth' | 'shadow' | 'light' | 'water' | 'sand' | 'ice';

export type FactionName = 'Лиорас' | 'Аэлантир' | 'Тэлэрион' | 'Элленар' | 'Фаэлин' | 'Сильванести' | 'Каледор';

export interface Faction {
  name: FactionName;
  element: ElementType;
  description: string;
  dragonType: string;
  specialAbility: string;
  baseStats: {
    power: number;
    defense: number;
    magic: number;
  };
}

export interface FactionAbility {
  name: string;
  description: string;
  cooldown: number;
  effect: string;
}