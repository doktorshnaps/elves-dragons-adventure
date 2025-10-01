import { Opponent } from "@/types/battle";
import { getMonsterData, getDungeonCSVName } from "@/utils/monsterDataParser";

interface DungeonConfig {
  internalName: string;
  monsterNames: {
    monster: (level: number) => string;
    miniboss: (level: number) => string;
    boss50: (level: number) => string;
    boss100: (level: number) => string;
  };
  monsterImages: {
    monster: (level: number) => string;
    miniboss: (level: number) => string;
    boss: (level: number) => string;
  };
}

/**
 * Создает генератор подземелья с балансом из CSV файла
 * Универсальная фабрика для всех подземелий
 */
export const createBalancedGenerator = (config: DungeonConfig) => {
  return async (level: number): Promise<Opponent[]> => {
    const csvName = getDungeonCSVName(config.internalName);
    const monsterData = await getMonsterData(csvName, level);

    if (!monsterData) {
      // Fallback к базовому монстру
      return [{
        id: 1,
        name: config.monsterNames.monster(level),
        health: 100 * level,
        maxHealth: 100 * level,
        power: 10 * level,
        armor: 5 * level,
        isBoss: false,
        image: config.monsterImages.monster(level)
      }];
    }

    // Определяем тип для getName
    const monsterType = monsterData.type.includes('boss') ? 
      (monsterData.type === 'boss100' ? 'boss100' : 'boss50') : 
      (monsterData.type === 'miniboss' ? 'miniboss' : 'monster');

    // Создаем монстра с характеристиками из CSV
    const monster: Opponent = {
      id: 1,
      name: config.monsterNames[monsterType](level),
      health: Math.floor(monsterData.hp),
      maxHealth: Math.floor(monsterData.hp),
      power: Math.floor(monsterData.attack),
      armor: Math.floor(monsterData.armor),
      isBoss: monsterData.type.includes('boss') || monsterData.type === 'miniboss',
      image: monsterData.type.includes('boss') || monsterData.type === 'miniboss' ? 
        config.monsterImages.boss(level) : 
        config.monsterImages.monster(level),
    };

    console.log(`[${config.internalName} Lv${level}] Generated ${monsterData.type}: HP=${monster.health}, ATK=${monster.power}, ARM=${monster.armor}`);

    return [monster];
  };
};
