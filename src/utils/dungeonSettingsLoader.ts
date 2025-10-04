import { supabase } from '@/integrations/supabase/client';

export interface DungeonSettings {
  id: string;
  dungeon_type: string;
  dungeon_name: string;
  dungeon_number: number;
  base_hp: number;
  base_armor: number;
  base_atk: number;
  hp_growth_coefficient: number;
  armor_growth_coefficient: number;
  atk_growth_coefficient: number;
  s_mob_base: number;
  dungeon_alpha: number;
  level_beta: number;
  level_g_coefficient: number;
  hp_growth: number;
  armor_growth: number;
  atk_growth: number;
}

let cachedSettings: DungeonSettings[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 секунд — быстрее подхватываем изменения из БД

export const getDungeonSettings = async (dungeonType: string): Promise<DungeonSettings | null> => {
  const now = Date.now();
  
  // Загружаем настройки из БД если кеш устарел
  if (!cachedSettings || now - lastFetchTime > CACHE_DURATION) {
    const { data, error } = await supabase
      .from('dungeon_settings')
      .select('*');
    
    if (error) {
      console.error('Error loading dungeon settings:', error);
      return null;
    }
    
    cachedSettings = data;
    lastFetchTime = now;
  }
  
  return cachedSettings?.find(s => s.dungeon_type === dungeonType) || null;
};

/**
 * Рассчитывает индекс мощности монстра с учетом настроек из БД
 */
export const calculatePowerIndexFromDB = async (
  dungeonType: string,
  level: number
): Promise<number> => {
  const settings = await getDungeonSettings(dungeonType);
  
  if (!settings) {
    // Fallback на дефолтные значения
    console.warn(`No settings found for ${dungeonType}, using defaults`);
    return 100 * Math.pow(1, 1.0) * Math.pow(1 + 0.045 * level, 1.0);
  }
  
  const { s_mob_base, dungeon_alpha, level_g_coefficient, level_beta, dungeon_number } = settings;
  
  return s_mob_base * Math.pow(dungeon_number, dungeon_alpha) * Math.pow(1 + level_g_coefficient * level, level_beta);
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
export const calculateMonsterStatsFromDB = async (
  dungeonType: string,
  level: number,
  monsterType: 'normal' | 'miniboss' | 'boss50' | 'boss100'
): Promise<MonsterStats> => {
  const settings = await getDungeonSettings(dungeonType);
  
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
    dungeon_number 
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

  // Типовые множители
  const typeMultipliers = {
    normal: { hp: 1.0, armor: 1.0, attack: 1.0 },
    miniboss: { hp: 1.5, armor: 1.2, attack: 1.0 },
    boss50: { hp: 2.5, armor: 1.3, attack: 1.1 },
    boss100: { hp: 4.0, armor: 1.5, attack: 1.15 }
  };

  const mult = typeMultipliers[monsterType];

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
