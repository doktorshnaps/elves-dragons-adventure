import { Opponent } from '@/types/battle';
import { getMonsterData } from '@/utils/monsterDataParser';
import { calculateMonsterStatsFromDB, getDungeonSettings } from '@/utils/dungeonSettingsLoader';
import { getMonsterById, getMonsterByName } from '@/utils/staticDataCache';
import { monsterImagesById, monsterImagesByName } from '@/constants/monsterImages';
import { monsterNameMapping } from './monsterNameMapping';

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

// Определяем тип монстра и количество - теперь с учетом настроек из кеша
const getWaveConfig = (dungeonType: string, level: number): { monsterType: string; count: number } => {
  const settings = getDungeonSettings(dungeonType);
  
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

      const id = (rawId || '').toLowerCase();
      const variants = Array.from(new Set([
        id,
        id.replace(/-/g, '_'),
        id.replace(/_/g, '-'),
      ]));

      // 1) Exact/normalized ID match using bundled assets (preferred)
      for (const v of variants) {
        if (monsterImagesById[v]) {
          const candidate = monsterImagesById[v];
          console.log(`✅ Found by ID match (${v}): ${candidate}`);
          if (candidate && !candidate.includes('placeholder')) {
            return candidate;
          }
        }
      }

      // 2) Fuzzy match by substring against known keys
      const keys = Object.keys(monsterImagesById);
      const foundKey = keys.find(k => variants.some(v => v.includes(k) || k.includes(v)));
      if (foundKey) {
        const candidate = monsterImagesById[foundKey];
        console.log(`✅ Found by fuzzy match (${foundKey}): ${candidate}`);
        if (candidate && !candidate.includes('placeholder')) {
          return candidate;
        }
      }

      // 3) Match by display name (from DB)
      if (name && monsterImagesByName[name]) {
        const candidate = monsterImagesByName[name];
        console.log(`✅ Found by name match: ${candidate}`);
        if (candidate && !candidate.includes('placeholder')) {
          return candidate;
        }
      }
      
      // 4) Try to find monster in cached DB data by name (without level suffix)
      if (name) {
        const nameWithoutLevel = name.replace(/\s*\(Lv\d+\)$/, '').trim();
        
        // First try original name from cache
        let dbMonster = getMonsterByName(nameWithoutLevel);
        
        if (dbMonster?.image_url) {
          console.log(`✅ Found by DB cache name lookup (${nameWithoutLevel}): ${dbMonster.image_url}`);
          return dbMonster.image_url;
        }
        
        // If not found, try mapped name as fallback
        const mappedName = monsterNameMapping[nameWithoutLevel];
        if (mappedName && mappedName !== nameWithoutLevel) {
          dbMonster = getMonsterByName(mappedName);
          
          if (dbMonster?.image_url) {
            console.log(`✅ Found by DB cache mapped name lookup (${mappedName}): ${dbMonster.image_url}`);
            return dbMonster.image_url;
          }
        }
      }

      // 5) Use DB image_url if provided (must be a valid public URL)
      if (rowImage) {
        console.log(`ℹ️ Fallback to DB image_url: ${rowImage}`);
        return rowImage;
      }

      // 6) Fallback to config defaults
      console.warn(`⚠️ No image found for monster "${rawId}" (${name}), using fallback`);
      const typeKey = monsterKind === 'normal' ? 'monster' : (monsterKind === 'miniboss' ? 'miniboss' : 'boss');
      if (typeKey === 'monster') return config.monsterImages.monster(lvl || level);
      if (typeKey === 'miniboss') return config.monsterImages.miniboss();
      return config.monsterImages.boss();
    };

    // 1) Пользовательские монстры из настроек кеша
    const settings = getDungeonSettings(config.internalName);
    const customLevel = settings?.monster_spawn_config?.level_monsters?.find(l => l.level === level && Array.isArray(l.monsters) && l.monsters.length > 0);
    
    console.log(`📝 Available monster image mappings:`, Object.keys(monsterImagesById));

    if (customLevel) {
      // Получаем данные о монстрах из кеша вместо запроса к БД
      const opponents: Opponent[] = [];
      let currentId = 1;
      
      for (const m of customLevel.monsters) {
        const row = getMonsterById(m.id) || { monster_id: m.id, monster_name: m.id, image_url: null, monster_type: 'normal' };
        const type = row?.monster_type === 'miniboss' ? 'miniboss' : (row?.monster_type === 'boss' ? 'boss50' : 'normal');
        const stats = calculateMonsterStatsFromDB(config.internalName, level, type as any);

        // Skip unknown IDs without bundled image mapping to avoid generic fallback
        const norm = (m.id || '').toLowerCase();
        const idVariants = Array.from(new Set([norm, norm.replace(/-/g, '_'), norm.replace(/_/g, '-')]));
        const hasBundledImage = idVariants.some(v => !!monsterImagesById[v]);
        if (!getMonsterById(m.id) && !hasBundledImage) {
          console.warn(`⏭️ Skipping unknown monster without image: ${m.id}`);
          continue;
        }

        for (let i = 0; i < Math.max(1, m.count); i++) {
          const finalImage = resolveMonsterImage(m.id, row?.monster_name, level, type as any, row?.image_url || undefined);
          console.log(`🖼️ Monster image for ${m.id} (${row?.monster_name}): ${finalImage}`);
          opponents.push({
            id: currentId++,
            name: row?.monster_name || m.id,
            power: stats.attack,
            health: stats.hp,
            maxHealth: stats.hp,
            armor: stats.armor,
            isBoss: type === 'boss50',
            isMiniboss: type === 'miniboss',
            image: finalImage
          });
        }
      }
      console.log(`[${config.internalName} Lv${level}] Generated ${opponents.length} opponents (type: custom)`);
      return opponents;
    }

    // 2) Базовая логика волн
    const waveConfig = getWaveConfig(config.internalName, level);
    
    // Пытаемся получить данные из CSV (для точной настройки)
    const monsterData = await getMonsterData(config.internalName, level);
    
    const opponents: Opponent[] = [];
    let currentId = 1;
    
    if (waveConfig.monsterType === 'boss50' || waveConfig.monsterType === 'boss100') {
      // Босс (один)
      const bossType = waveConfig.monsterType === 'boss50' ? 'boss50' : 'boss100';
      
      // Используем формулу S_mob для расчета статов из кеша
      const bossStats = calculateMonsterStatsFromDB(config.internalName, level, bossType);
      
      // Если есть CSV данные, используем их как приоритет (для точной балансировки)
      const finalStats = monsterData ? {
        hp: monsterData.hp,
        armor: monsterData.armor,
        attack: monsterData.attack
      } : bossStats;
      
      const bossName = config.monsterNames[bossType](level);
      const bossImage = resolveMonsterImage(undefined, bossName, level, bossType, undefined);
      
      opponents.push({
        id: currentId++,
        name: bossName,
        power: finalStats.attack,
        health: finalStats.hp,
        maxHealth: finalStats.hp,
        armor: finalStats.armor,
        isBoss: true,
        image: bossImage
      });
    } else if (waveConfig.monsterType === 'miniboss_wave') {
      // 9 обычных монстров
      const normalStats = calculateMonsterStatsFromDB(config.internalName, level, 'normal');
      
      for (let i = 0; i < 9; i++) {
        const finalStats = monsterData ? {
          hp: monsterData.hp,
          armor: monsterData.armor,
          attack: monsterData.attack
        } : normalStats;
        
        const normalName = config.monsterNames.monster(level);
        const normalImage = resolveMonsterImage(undefined, normalName, level, 'normal', undefined);
        
        opponents.push({
          id: currentId++,
          name: normalName,
          power: finalStats.attack,
          health: finalStats.hp,
          maxHealth: finalStats.hp,
          armor: finalStats.armor,
          isBoss: false,
          image: normalImage
        });
      }
      
      // + 1 минибосс
      const minibossStats = calculateMonsterStatsFromDB(config.internalName, level, 'miniboss');
      const minibossData = await getMonsterData(config.internalName, level);
      
      // Множители для минибосса уже применены в calculateMonsterStatsFromDB
      const finalMinibossStats = minibossData ? {
        hp: minibossData.hp,
        armor: minibossData.armor,
        attack: minibossData.attack
      } : minibossStats;
      
      const minibossName = config.monsterNames.miniboss(level);
      const minibossImage = resolveMonsterImage(undefined, minibossName, level, 'miniboss', undefined);
      
      opponents.push({
        id: currentId++,
        name: minibossName,
        power: finalMinibossStats.attack,
        health: finalMinibossStats.hp,
        maxHealth: finalMinibossStats.hp,
        armor: finalMinibossStats.armor,
        isBoss: false,
        isMiniboss: true,
        image: minibossImage
      });
    } else {
      // Обычные монстры (от 1 до 9)
      const normalStats = calculateMonsterStatsFromDB(config.internalName, level, 'normal');
      
      for (let i = 0; i < waveConfig.count; i++) {
        const finalStats = monsterData ? {
          hp: monsterData.hp,
          armor: monsterData.armor,
          attack: monsterData.attack
        } : normalStats;
        
        const normalName = config.monsterNames.monster(level);
        const normalImage = resolveMonsterImage(undefined, normalName, level, 'normal', undefined);
        
        opponents.push({
          id: currentId++,
          name: normalName,
          power: finalStats.attack,
          health: finalStats.hp,
          maxHealth: finalStats.hp,
          armor: finalStats.armor,
          isBoss: false,
          image: normalImage
        });
      }
    }
    
    console.log(`[${config.internalName} Lv${level}] Generated ${opponents.length} opponents (type: ${waveConfig.monsterType})`);
    return opponents;
  };
