export interface CardInfo {
  name: string;
  type: 'character' | 'pet';
  description: string;
  faction?: string;
  baseStats: {
    power: number;
    defense: number;
    health: number;
    magic: number;
  };
  image?: string;
}