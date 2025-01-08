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

export const getRarityLabel = (rarity: Rarity): string => {
  return "⭐".repeat(rarity);
};

export const getCardPrice = (rarity: Rarity): number => {
  return Math.floor(50 * Math.pow(2, rarity - 1));
};