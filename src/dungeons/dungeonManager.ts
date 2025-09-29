import { BlackDragonLairGenerator } from './BlackDragonLair';
import { ForgottenSoulsCaveGenerator } from './ForgottenSoulsCave';
import { IcyThroneGenerator } from './IcyThroneGenerator';
import { DarkMageTowerGenerator } from './DarkMageTowerGenerator';
import { SpiderNestGenerator } from './SpiderNestGenerator';
import { BoneDemonDungeonGenerator } from './BoneDemonDungeonGenerator';
import { SeaSerpentLairGenerator } from './SeaSerpentLairGenerator';
import { PantheonOfGodsGenerator } from './PantheonOfGodsGenerator';
import { DungeonType } from '@/constants/dungeons';

const dungeonGenerators = {
  dragon_lair: BlackDragonLairGenerator,
  forgotten_souls: ForgottenSoulsCaveGenerator,
  ice_throne: IcyThroneGenerator,
  dark_mage: DarkMageTowerGenerator,
  spider_nest: SpiderNestGenerator,
  bone_dungeon: BoneDemonDungeonGenerator,
  sea_serpent: SeaSerpentLairGenerator,
  pantheon_gods: PantheonOfGodsGenerator
};

export const generateDungeonOpponents = (dungeonType: DungeonType, level: number) => {
  console.log("Generating opponents for dungeon:", dungeonType);
  
  const generator = dungeonGenerators[dungeonType];
  if (!generator) {
    throw new Error(`No generator found for dungeon type: ${dungeonType}`);
  }

  return generator(level);
};