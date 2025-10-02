import { Opponent } from '@/types/battle';
import { getMonsterData } from '@/utils/monsterDataParser';

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
    const monsterData = await getMonsterData(config.internalName, level);
    
    const opponents: Opponent[] = [];
    let currentId = 1;
    
    if (waveConfig.monsterType === 'boss50' || waveConfig.monsterType === 'boss100') {
      // Босс (один)
      const bossType = waveConfig.monsterType === 'boss50' ? 'boss50' : 'boss100';
      
      if (monsterData) {
        opponents.push({
          id: currentId++,
          name: config.monsterNames[bossType](level),
          power: monsterData.attack,
          health: monsterData.hp,
          maxHealth: monsterData.hp,
          armor: monsterData.armor,
          isBoss: true,
          image: config.monsterImages.boss()
        });
      } else {
        // Fallback босс
        const bossMultiplier = bossType === 'boss100' ? 4.0 : 2.5;
        opponents.push({
          id: currentId++,
          name: config.monsterNames[bossType](level),
          power: Math.floor(30 * level * bossMultiplier),
          health: Math.floor(100 * level * bossMultiplier),
          maxHealth: Math.floor(100 * level * bossMultiplier),
          armor: Math.floor(20 * level * bossMultiplier),
          isBoss: true,
          image: config.monsterImages.boss()
        });
      }
    } else if (waveConfig.monsterType === 'miniboss_wave') {
      // 9 обычных монстров
      for (let i = 0; i < 9; i++) {
        if (monsterData) {
          opponents.push({
            id: currentId++,
            name: config.monsterNames.monster(level),
            power: monsterData.attack,
            health: monsterData.hp,
            maxHealth: monsterData.hp,
            armor: monsterData.armor,
            isBoss: false,
            image: config.monsterImages.monster(level)
          });
        } else {
          opponents.push({
            id: currentId++,
            name: config.monsterNames.monster(level),
            power: Math.floor(30 * level),
            health: Math.floor(100 * level),
            maxHealth: Math.floor(100 * level),
            armor: Math.floor(20 * level),
            isBoss: false,
            image: config.monsterImages.monster(level)
          });
        }
      }
      
      // + 1 минибосс
      const minibossData = await getMonsterData(config.internalName, level);
      if (minibossData) {
        opponents.push({
          id: currentId++,
          name: config.monsterNames.miniboss(level),
          power: Math.floor(minibossData.attack * 1.5),
          health: Math.floor(minibossData.hp * 1.5),
          maxHealth: Math.floor(minibossData.hp * 1.5),
          armor: Math.floor(minibossData.armor * 1.5),
          isBoss: true,
          image: config.monsterImages.miniboss()
        });
      } else {
        opponents.push({
          id: currentId++,
          name: config.monsterNames.miniboss(level),
          power: Math.floor(30 * level * 1.5),
          health: Math.floor(100 * level * 1.5),
          maxHealth: Math.floor(100 * level * 1.5),
          armor: Math.floor(20 * level * 1.5),
          isBoss: true,
          image: config.monsterImages.miniboss()
        });
      }
    } else {
      // Обычные монстры (от 1 до 9)
      for (let i = 0; i < waveConfig.count; i++) {
        if (monsterData) {
          opponents.push({
            id: currentId++,
            name: config.monsterNames.monster(level),
            power: monsterData.attack,
            health: monsterData.hp,
            maxHealth: monsterData.hp,
            armor: monsterData.armor,
            isBoss: false,
            image: config.monsterImages.monster(level)
          });
        } else {
          opponents.push({
            id: currentId++,
            name: config.monsterNames.monster(level),
            power: Math.floor(30 * level),
            health: Math.floor(100 * level),
            maxHealth: Math.floor(100 * level),
            armor: Math.floor(20 * level),
            isBoss: false,
            image: config.monsterImages.monster(level)
          });
        }
      }
    }
    
    console.log(`[${config.internalName} Lv${level}] Generated ${opponents.length} opponents (type: ${waveConfig.monsterType})`);
    return opponents;
  };
