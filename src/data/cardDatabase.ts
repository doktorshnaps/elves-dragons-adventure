import { CardInfo } from './cards/types';
import { kaledorHeroes } from './cards/characters/kaledorHeroes';
import { sylvanestiHeroes } from './cards/characters/sylvanestiHeroes';
import { faelinHeroes } from './cards/characters/faelinHeroes';
import { ellenarHeroes } from './cards/characters/ellenarHeroes';
import { telerionHeroes } from './cards/characters/telerionHeroes';
import { aelantirHeroes } from './cards/characters/aelantirHeroes';
import { liorasHeroes } from './cards/characters/liorasHeroes';
import { basePets } from './cards/pets/basePets';
import { kaledorDragons } from './cards/pets/DragonsKaledor';
import { sylvanestiDragons } from './cards/pets/DragonsSylvanesti';
import { faelinDragons } from './cards/pets/DragonsFaelin';
import { ellenarDragons } from './cards/pets/DragonsEllenar';
import { telerionDragons } from './cards/pets/DragonsTelerion';
import { aelantirDragons } from './cards/pets/DragonsAelantir';
import { liorasDragons } from './cards/pets/DragonsLioras';

export const cardDatabase: CardInfo[] = [
  ...kaledorHeroes,
  ...sylvanestiHeroes,
  ...faelinHeroes,
  ...ellenarHeroes,
  ...telerionHeroes,
  ...aelantirHeroes,
  ...liorasHeroes,
  ...basePets,
  ...kaledorDragons,
  ...sylvanestiDragons,
  ...faelinDragons,
  ...ellenarDragons,
  ...telerionDragons,
  ...aelantirDragons,
  ...liorasDragons
];