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
}

let cachedSettings: DungeonSettings[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 минута

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
 * Рассчитывает статы монстра с учетом настроек из БД
 */
export const calculateMonsterStatsFromDB = async (
  dungeonType: string,
  level: number,
  monsterType: 'normal' | 'miniboss' | 'boss50' | 'boss100'
): Promise<MonsterStats> => {
  const smob = await calculatePowerIndexFromDB(dungeonType, level);
  const settings = await getDungeonSettings(dungeonType);
  
  if (!settings) {
    // Fallback на стандартные пропорции
    console.warn(`No settings found for ${dungeonType}, using default proportions`);
    return calculateDefaultStats(smob, monsterType);
  }
  
  const { hp_growth_coefficient, armor_growth_coefficient, atk_growth_coefficient } = settings;
  
  switch (monsterType) {
    case 'normal':
      return {
        hp: Math.floor(hp_growth_coefficient * smob),
        armor: Math.floor(armor_growth_coefficient * smob),
        attack: Math.floor(atk_growth_coefficient * smob)
      };
    
    case 'miniboss':
      // ×1.5 множитель для минибосса
      return {
        hp: Math.floor(0.85 * 1.5 * smob),
        armor: Math.floor(0.20 * 1.5 * smob),
        attack: Math.floor(0.10 * 1.5 * smob)
      };
    
    case 'boss50':
      // ×2.5 множитель для босса 50
      return {
        hp: Math.floor(0.80 * 2.5 * smob),
        armor: Math.floor(0.22 * 2.5 * smob),
        attack: Math.floor(0.12 * 2.5 * smob)
      };
    
    case 'boss100':
      // ×4.0 множитель для финального босса
      return {
        hp: Math.floor(0.85 * 4.0 * smob),
        armor: Math.floor(0.25 * 4.0 * smob),
        attack: Math.floor(0.10 * 4.0 * smob)
      };
  }
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
