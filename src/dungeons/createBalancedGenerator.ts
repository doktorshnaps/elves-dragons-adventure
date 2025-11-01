import { Opponent } from '@/types/battle';
import { getMonsterData } from '@/utils/monsterDataParser';
import { calculateMonsterStatsFromDB, getDungeonSettings } from '@/utils/dungeonSettingsLoader';

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
