export type CardType = 'character' | 'pet';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  power: number;
  defense: number;
  image?: string;
}

export interface CardPack {
  id: string;
  cards: Card[];
}