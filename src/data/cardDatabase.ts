import { CardInfo } from './cards/types';
import { kaledorHeroes } from './cards/characters/kaledorHeroes';
import { sylvanestiHeroes } from './cards/characters/sylvanestiHeroes';
import { faelinHeroes } from './cards/characters/faelinHeroes';
import { ellenarHeroes } from './cards/characters/ellenarHeroes';
import { telerionHeroes } from './cards/characters/telerionHeroes';
import { aelantirHeroes } from './cards/characters/aelantirHeroes';
import { liorasHeroes } from './cards/characters/liorasHeroes';
import { basePets } from './cards/pets/basePets';

export const cardDatabase: CardInfo[] = [
  ...kaledorHeroes,
  ...sylvanestiHeroes,
  ...faelinHeroes,
  ...ellenarHeroes,
  ...telerionHeroes,
  ...aelantirHeroes,
  ...liorasHeroes,
  ...basePets
];