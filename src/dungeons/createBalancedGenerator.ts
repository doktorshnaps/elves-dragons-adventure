import { Opponent } from '@/types/battle';
import { getMonsterData } from '@/utils/monsterDataParser';
import { calculateMonsterStatsFromDB, getDungeonSettings } from '@/utils/dungeonSettingsLoader';
import { supabase } from '@/integrations/supabase/client';
import { monsterImagesById, monsterImagesByName } from '@/constants/monsterImages';

export interface DungeonConfig {
  internalName: string;
  monsterNames: {
    monster: (level: number) => string;
    miniboss: (level: number) => string;
    boss50: (level: number) => string;
    boss100: (level: number) => string;
  };
  monsterImages: {
    monster: (level: number) => string;
    miniboss: () => string;
    boss: () => string;
  };
}

// Определяем тип монстра и количество - теперь с учетом настроек из БД
const getWaveConfig = async (dungeonType: string, level: number): Promise<{ monsterType: string; count: number }> => {
  const settings = await getDungeonSettings(dungeonType);
  
  if (!settings) {
    // Fallback к дефолтной логике, если настройки не загружены
    if (level === 50) return { monsterType: 'boss50', count: 1 };
    if (level === 100) return { monsterType: 'boss100', count: 1 };
    const posInTen = ((level - 1) % 10) + 1;
    if (posInTen === 10) return { monsterType: 'miniboss_wave', count: 10 };
    return { monsterType: 'monster', count: posInTen };
  }
  
  const { monster_spawn_config } = settings;
  
  // Проверяем, является ли уровень боссом 50 или 100
  if (level === monster_spawn_config.boss50.level) {
    return { monsterType: 'boss50', count: 1 };
  }
  if (level === monster_spawn_config.boss100.level) {
    return { monsterType: 'boss100', count: 1 };
  }
  
  // Проверяем, является ли уровень уровнем минибосса
  if (monster_spawn_config.miniboss.levels.includes(level)) {
    return { monsterType: 'miniboss_wave', count: 10 }; // 9 обычных + 1 минибосс
  }
  
  // Определяем позицию в десятке для обычных монстров (1-9)
  const posInTen = ((level - 1) % 10) + 1;
  return { monsterType: 'monster', count: posInTen };
};

export const createBalancedGenerator = (config: DungeonConfig) => 
  async (level: number): Promise<Opponent[]> => {
    console.log(`🎮 Creating opponents for ${config.internalName} level ${level}`);
    
    // Resolves the best image for a monster using multiple strategies
    const resolveMonsterImage = (
      rawId?: string,
      name?: string,
      lvl?: number,
      monsterKind: 'normal' | 'miniboss' | 'boss50' | 'boss100' = 'normal',
      rowImage?: string
    ) => {
      console.log(`🔍 Resolving image for monster: id="${rawId}", name="${name}", type="${monsterKind}"`);
      
      // 1) Use DB image_url if provided (highest priority for custom monsters)
      if (rowImage) {
        console.log(`✅ Using DB image_url: ${rowImage}`);
        return rowImage;
      }

      const id = (rawId || '').toLowerCase();
      const variants = Array.from(new Set([
        id,
        id.replace(/-/g, '_'),
        id.replace(/_/g, '-'),
      ]));

      // 2) Exact/normalized ID match
      for (const v of variants) {
        if (monsterImagesById[v]) {
          console.log(`✅ Found by ID match (${v}): ${monsterImagesById[v]}`);
          return monsterImagesById[v];
        }
      }

      // 3) Fuzzy match by substring against known keys
      const keys = Object.keys(monsterImagesById);
      const foundKey = keys.find(k => variants.some(v => v.includes(k) || k.includes(v)));
      if (foundKey) {
        console.log(`✅ Found by fuzzy match (${foundKey}): ${monsterImagesById[foundKey]}`);
        return monsterImagesById[foundKey];
      }

      // 4) Match by display name (from DB)
      if (name && monsterImagesByName[name]) {
        console.log(`✅ Found by name match: ${monsterImagesByName[name]}`);
        return monsterImagesByName[name];
      }

      // 5) Fallback to config defaults
      console.warn(`⚠️ No image found for monster "${rawId}" (${name}), using fallback`);
      const typeKey = monsterKind === 'normal' ? 'monster' : (monsterKind === 'miniboss' ? 'miniboss' : 'boss');
      if (typeKey === 'monster') return config.monsterImages.monster(lvl || level);
      if (typeKey === 'miniboss') return config.monsterImages.miniboss();
      return config.monsterImages.boss();
    };

    // 1) Пользовательские монстры из настроек БД
    const settings = await getDungeonSettings(config.internalName);
    const customLevel = settings?.monster_spawn_config?.level_monsters?.find(l => l.level === level && Array.isArray(l.monsters) && l.monsters.length > 0);
    
    console.log(`📝 Available monster image mappings:`, Object.keys(monsterImagesById));

    if (customLevel) {
      // Загружаем данные о монстрах по их id
      const ids = customLevel.monsters.map(m => m.id);
      const { data: rows, error } = await supabase
        .from('monsters')
        .select('monster_id, monster_name, image_url, monster_type')
        .in('monster_id', ids);

      if (error) {
        console.error('❌ Failed to load monsters for custom level:', error);
      } else {
        const opponents: Opponent[] = [];
        let currentId = 1;
        for (const m of customLevel.monsters) {
          const row = rows?.find(r => r.monster_id === m.id);
          const type = row?.monster_type === 'miniboss' ? 'miniboss' : (row?.monster_type === 'boss' ? 'boss50' : 'normal');
          const stats = await calculateMonsterStatsFromDB(config.internalName, level, type as any);
          for (let i = 0; i < Math.max(1, m.count); i++) {
            const finalImage = resolveMonsterImage(m.id, row?.monster_name, level, type as any, row?.image_url);
            console.log(`🖼️ Monster image for ${m.id} (${row?.monster_name}): ${finalImage}`);
            opponents.push({
              id: currentId++,
              name: row?.monster_name || config.monsterNames.monster(level),
              power: stats.attack,
              health: stats.hp,
              maxHealth: stats.hp,
              armor: stats.armor,
              isBoss: type !== 'normal',
              image: finalImage
            });
          }
        }
        console.log(`[${config.internalName} Lv${level}] Generated ${opponents.length} opponents (type: custom)`);
        return opponents;
      }
    }

    // 2) Базовая логика волн
    const waveConfig = await getWaveConfig(config.internalName, level);
    
    // Пытаемся получить данные из CSV (для точной настройки)
    const monsterData = await getMonsterData(config.internalName, level);
    
    const opponents: Opponent[] = [];
    let currentId = 1;
    
    if (waveConfig.monsterType === 'boss50' || waveConfig.monsterType === 'boss100') {
      // Босс (один)
      const bossType = waveConfig.monsterType === 'boss50' ? 'boss50' : 'boss100';
      
      // Используем формулу S_mob для расчета статов из БД
      const bossStats = await calculateMonsterStatsFromDB(config.internalName, level, bossType);
      
      // Если есть CSV данные, используем их как приоритет (для точной балансировки)
      const finalStats = monsterData ? {
        hp: monsterData.hp,
        armor: monsterData.armor,
        attack: monsterData.attack
      } : bossStats;
      
      opponents.push({
        id: currentId++,
        name: config.monsterNames[bossType](level),
        power: finalStats.attack,
        health: finalStats.hp,
        maxHealth: finalStats.hp,
        armor: finalStats.armor,
        isBoss: true,
        image: config.monsterImages.boss()
      });
    } else if (waveConfig.monsterType === 'miniboss_wave') {
      // 9 обычных монстров
      const normalStats = await calculateMonsterStatsFromDB(config.internalName, level, 'normal');
      
      for (let i = 0; i < 9; i++) {
        const finalStats = monsterData ? {
          hp: monsterData.hp,
          armor: monsterData.armor,
          attack: monsterData.attack
        } : normalStats;
        
        opponents.push({
          id: currentId++,
          name: config.monsterNames.monster(level),
          power: finalStats.attack,
          health: finalStats.hp,
          maxHealth: finalStats.hp,
          armor: finalStats.armor,
          isBoss: false,
          image: config.monsterImages.monster(level)
        });
      }
      
      // + 1 минибосс
      const minibossStats = await calculateMonsterStatsFromDB(config.internalName, level, 'miniboss');
      const minibossData = await getMonsterData(config.internalName, level);
      
      // Множители для минибосса уже применены в calculateMonsterStatsFromDB
      const finalMinibossStats = minibossData ? {
        hp: minibossData.hp,
        armor: minibossData.armor,
        attack: minibossData.attack
      } : minibossStats;
      
      opponents.push({
        id: currentId++,
        name: config.monsterNames.miniboss(level),
        power: finalMinibossStats.attack,
        health: finalMinibossStats.hp,
        maxHealth: finalMinibossStats.hp,
        armor: finalMinibossStats.armor,
        isBoss: true,
        image: config.monsterImages.miniboss()
      });
    } else {
      // Обычные монстры (от 1 до 9)
      const normalStats = await calculateMonsterStatsFromDB(config.internalName, level, 'normal');
      
      for (let i = 0; i < waveConfig.count; i++) {
        const finalStats = monsterData ? {
          hp: monsterData.hp,
          armor: monsterData.armor,
          attack: monsterData.attack
        } : normalStats;
        
        opponents.push({
          id: currentId++,
          name: config.monsterNames.monster(level),
          power: finalStats.attack,
          health: finalStats.hp,
          maxHealth: finalStats.hp,
          armor: finalStats.armor,
          isBoss: false,
          image: config.monsterImages.monster(level)
        });
      }
    }
    
    console.log(`[${config.internalName} Lv${level}] Generated ${opponents.length} opponents (type: ${waveConfig.monsterType})`);
    return opponents;
  };
