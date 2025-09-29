export interface CardInfo {
  name: string;
  type: 'character' | 'pet';
  description: string;
  faction?: string;
  image?: string;
}