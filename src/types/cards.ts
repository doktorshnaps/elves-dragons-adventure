export type CardType = 'character' | 'pet';
export type Rarity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Card {
  id: string;
  name: string;
  type: CardType;
  power: number;
  defense: number;
  rarity: Rarity;
  image?: string;
}

export interface CardPack {
  id: string;
  cards: Card[];
}