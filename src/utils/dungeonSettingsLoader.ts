import { getDungeonSettingsByType } from './staticDataCache';

export interface MonsterWithCount {
  id: string;
  count: number;
}

export interface LevelMonsterConfig {
  level: number;
  monsters: MonsterWithCount[];
}

export interface MonsterSpawnConfig {
  normal: { min_level: number; max_level: number };
  miniboss: { levels: number[] };
  boss50: { level: number };
  boss100: { level: number };
  level_monsters?: LevelMonsterConfig[];
}

export interface BossMultipliers {
  boss50: number;
  boss100: number;
}

export interface DungeonSettings {
  id: string;
  dungeon_type: string;
  dungeon_name: string;
  dungeon_number: number;
  base_hp: number;
  base_armor: number;
  base_atk: number;
  hp_growth: number;
  armor_growth: number;
  atk_growth: number;
  monster_spawn_config: MonsterSpawnConfig;
  miniboss_hp_multiplier: number;
  miniboss_armor_multiplier: number;
  miniboss_atk_multiplier: number;
  boss_hp_multipliers: BossMultipliers;
  boss_armor_multipliers: BossMultipliers;
  boss_atk_multipliers: BossMultipliers;
}

/**
 * Получить настройки подземелья из кеша React Query (без запроса к БД)
 */
export const getDungeonSettings = (dungeonType: string): DungeonSettings | null => {
  const settings = getDungeonSettingsByType(dungeonType);
  
  if (!settings) {
    console.warn(`⚠️ No settings found in cache for ${dungeonType}`);
    return null;
  }
  
  // Преобразуем типы
  return {
    ...settings,
    monster_spawn_config: settings.monster_spawn_config as unknown as MonsterSpawnConfig,
    miniboss_hp_multiplier: settings.miniboss_hp_multiplier || 1.5,
    miniboss_armor_multiplier: settings.miniboss_armor_multiplier || 1.5,
    miniboss_atk_multiplier: settings.miniboss_atk_multiplier || 1.5,
    boss_hp_multipliers: settings.boss_hp_multipliers as unknown as BossMultipliers,
    boss_armor_multipliers: settings.boss_armor_multipliers as unknown as BossMultipliers,
    boss_atk_multipliers: settings.boss_atk_multipliers as unknown as BossMultipliers,
  };
};


export interface MonsterStats {
  hp: number;
  armor: number;
  attack: number;
}

/**
 * Рассчитывает статы монстра с учетом новых формул роста
 * HP(D,L) = baseHP × hpGrowth^((L-1)/10) × dungeonFactor(D)
 * Armor(D,L) = baseArmor × armorGrowth^((L-1)/10) × dungeonFactor(D)
 * ATK(D,L) = baseATK × atkGrowth^((L-1)/10) × dungeonFactor(D)
 */
export const calculateMonsterStatsFromDB = (
  dungeonType: string,
  level: number,
  monsterType: 'normal' | 'miniboss' | 'boss50' | 'boss100'
): MonsterStats => {
  const settings = getDungeonSettings(dungeonType);
  
  if (!settings) {
    console.warn(`No settings found for ${dungeonType}, using defaults`);
    return calculateDefaultStats(100, monsterType);
  }
  
  const { 
    base_hp, 
    base_armor, 
    base_atk, 
    hp_growth, 
    armor_growth, 
    atk_growth,
    dungeon_number,
    miniboss_hp_multiplier,
    miniboss_armor_multiplier,
    miniboss_atk_multiplier,
    boss_hp_multipliers,
    boss_armor_multipliers,
    boss_atk_multipliers
  } = settings;

  // Dungeon factor: 1.2^(D-1)
  const dungeonFactor = Math.pow(1.2, dungeon_number - 1);

  // Рост по уровню: growth^((L-1)/10)
  const levelIndex = Math.max(0, level - 1) / 10;
  const hpLevelGrowth = Math.pow(hp_growth, levelIndex);
  const armorLevelGrowth = Math.pow(armor_growth, levelIndex);
  const atkLevelGrowth = Math.pow(atk_growth, levelIndex);

  // Базовые статы
  const baseStats = {
    hp: Math.floor(base_hp * hpLevelGrowth * dungeonFactor),
    armor: Math.floor(base_armor * armorLevelGrowth * dungeonFactor),
    attack: Math.floor(base_atk * atkLevelGrowth * dungeonFactor)
  };

  // Множители по типу монстра - используем настройки из БД
  let mult = { hp: 1.0, armor: 1.0, attack: 1.0 };
  
  switch (monsterType) {
    case 'normal':
      mult = { hp: 1.0, armor: 1.0, attack: 1.0 };
      break;
    case 'miniboss':
      mult = {
        hp: miniboss_hp_multiplier,
        armor: miniboss_armor_multiplier,
        attack: miniboss_atk_multiplier
      };
      break;
    case 'boss50':
      mult = {
        hp: boss_hp_multipliers.boss50,
        armor: boss_armor_multipliers.boss50,
        attack: boss_atk_multipliers.boss50
      };
      break;
    case 'boss100':
      mult = {
        hp: boss_hp_multipliers.boss100,
        armor: boss_armor_multipliers.boss100,
        attack: boss_atk_multipliers.boss100
      };
      break;
  }

  return {
    hp: Math.floor(baseStats.hp * mult.hp),
    armor: Math.floor(baseStats.armor * mult.armor),
    attack: Math.floor(baseStats.attack * mult.attack)
  };
};

// Fallback функция с дефолтными пропорциями
const calculateDefaultStats = (smob: number, type: 'normal' | 'miniboss' | 'boss50' | 'boss100'): MonsterStats => {
  switch (type) {
    case 'normal':
      return {
        hp: Math.floor(0.70 * smob),
        armor: Math.floor(0.18 * smob),
        attack: Math.floor(0.18 * smob)
      };
    case 'miniboss':
      return {
        hp: Math.floor(0.85 * 1.5 * smob),
        armor: Math.floor(0.20 * 1.5 * smob),
        attack: Math.floor(0.10 * 1.5 * smob)
      };
    case 'boss50':
      return {
        hp: Math.floor(0.80 * 2.5 * smob),
        armor: Math.floor(0.22 * 2.5 * smob),
        attack: Math.floor(0.12 * 2.5 * smob)
      };
    case 'boss100':
      return {
        hp: Math.floor(0.85 * 4.0 * smob),
        armor: Math.floor(0.25 * 4.0 * smob),
        attack: Math.floor(0.10 * 4.0 * smob)
      };
  }
};
