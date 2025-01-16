import { CardInfo } from './cards/types';
import { kaledorHeroes } from './cards/characters/kaledorHeroes';
import { basePets } from './cards/pets/basePets';

export const cardDatabase: CardInfo[] = [
  ...kaledorHeroes,
  ...basePets
];