// Старые генераторы (оставлены для совместимости)
import { BlackDragonLairGenerator } from './BlackDragonLair';
import { ForgottenSoulsCaveGenerator } from './ForgottenSoulsCave';
import { IcyThroneGenerator } from './IcyThroneGenerator';
import { DarkMageTowerGenerator } from './DarkMageTowerGenerator';
import { SpiderNestGenerator } from './SpiderNestGenerator';
import { BoneDemonDungeonGenerator } from './BoneDemonDungeonGenerator';
import { SeaSerpentLairGenerator } from './SeaSerpentLairGenerator';
import { PantheonOfGodsGenerator } from './PantheonOfGodsGenerator';

// Новые сбалансированные генераторы из CSV
import { SpiderNestGeneratorBalanced } from './SpiderNestGeneratorBalanced';
import { BoneDemonDungeonGeneratorBalanced } from './BoneDemonDungeonGeneratorBalanced';
import { DarkMageTowerGeneratorBalanced } from './DarkMageTowerGeneratorBalanced';
import { ForgottenSoulsCaveBalanced } from './ForgottenSoulsCaveBalanced';
import { IcyThroneGeneratorBalanced } from './IcyThroneGeneratorBalanced';
import { SeaSerpentLairGeneratorBalanced } from './SeaSerpentLairGeneratorBalanced';
import { BlackDragonLairBalanced } from './BlackDragonLairBalanced';
import { PantheonOfGodsGeneratorBalanced } from './PantheonOfGodsGeneratorBalanced';

import { DungeonType } from '@/constants/dungeons';

// Флаг для переключения между старыми и новыми генераторами
const USE_BALANCED_GENERATORS = true;

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

const balancedDungeonGenerators = {
  dragon_lair: BlackDragonLairBalanced,
  forgotten_souls: ForgottenSoulsCaveBalanced,
  ice_throne: IcyThroneGeneratorBalanced,
  dark_mage: DarkMageTowerGeneratorBalanced,
  spider_nest: SpiderNestGeneratorBalanced,
  bone_dungeon: BoneDemonDungeonGeneratorBalanced,
  sea_serpent: SeaSerpentLairGeneratorBalanced,
  pantheon_gods: PantheonOfGodsGeneratorBalanced
};

export const generateDungeonOpponents = async (dungeonType: DungeonType, level: number) => {
  console.log(`🎮 Generating opponents for dungeon: ${dungeonType}, level: ${level}`);
  
  // Выбираем генератор в зависимости от флага
  const generators = USE_BALANCED_GENERATORS ? balancedDungeonGenerators : dungeonGenerators;
  const generator = generators[dungeonType];
  
  if (!generator) {
    throw new Error(`No generator found for dungeon type: ${dungeonType}`);
  }

  // Сбалансированные генераторы асинхронные
  if (USE_BALANCED_GENERATORS) {
    return await generator(level);
  }

  return generator(level);
};