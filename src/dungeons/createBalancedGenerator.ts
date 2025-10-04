import { Opponent } from '@/types/battle';
import { getMonsterData } from '@/utils/monsterDataParser';
import { calculatePowerIndexFromDB, calculateMonsterStatsFromDB } from '@/utils/dungeonSettingsLoader';

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

// Определяем тип монстра и количество согласно ТЗ
const getWaveConfig = (level: number): { monsterType: string; count: number } => {
  // Уровни 50 и 100 - только босс
  if (level === 50) return { monsterType: 'boss50', count: 1 };
  if (level === 100) return { monsterType: 'boss100', count: 1 };
  
  // Определяем позицию в десятке (1-10)
  const posInTen = ((level - 1) % 10) + 1;
  
  // Уровень 10, 20, 30, 40 и т.д. - 9 обычных + минибосс
  if (posInTen === 10) {
    return { monsterType: 'miniboss_wave', count: 10 }; // 9 обычных + 1 минибосс
  }
  
  // Уровни 1-9 в десятке: количество = номер в десятке
  return { monsterType: 'monster', count: posInTen };
};

export const createBalancedGenerator = (config: DungeonConfig) => 
  async (level: number): Promise<Opponent[]> => {
    const waveConfig = getWaveConfig(level);
    
    // Рассчитываем S_mob для этого уровня из БД
    const smob = await calculatePowerIndexFromDB(config.internalName, level);
    
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
      
      const finalMinibossStats = minibossData ? {
        hp: Math.floor(minibossData.hp * 1.5),
        armor: Math.floor(minibossData.armor * 1.5),
        attack: Math.floor(minibossData.attack * 1.5)
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
    
    console.log(`[${config.internalName} Lv${level}] S_mob=${smob.toFixed(1)}, Generated ${opponents.length} opponents (type: ${waveConfig.monsterType})`);
    return opponents;
  };
