import { Opponent } from "@/types/battle";
import { monsterImagesByType } from "@/constants/monsterImages";
import { getMonsterData, getDungeonCSVName } from "@/utils/monsterDataParser";

/**
 * Генератор для Паучьего Гнезда с балансом из CSV файла
 * По 1 монстру на уровень с характеристиками из monsters_balanced.csv
 */
export const SpiderNestGeneratorBalanced = async (level: number): Promise<Opponent[]> => {
  const csvName = getDungeonCSVName('spider_nest');
  const monsterData = await getMonsterData(csvName, level);

  if (!monsterData) {
    // Fallback к базовому монстру
    return [{
      id: 1,
      name: "Паук",
      health: 100 * level,
      maxHealth: 100 * level,
      power: 10 * level,
      armor: 5 * level,
      isBoss: false,
      image: monsterImagesByType.skeleton_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png"
    }];
  }

  // Создаем монстра с характеристиками из CSV
  const monster: Opponent = {
    id: 1,
    name: getMonsterName(monsterData.type, level),
    health: Math.floor(monsterData.hp),
    maxHealth: Math.floor(monsterData.hp),
    power: Math.floor(monsterData.attack),
    armor: Math.floor(monsterData.armor),
    isBoss: monsterData.type.includes('boss') || monsterData.type === 'miniboss',
    image: getMonsterImage(monsterData.type, level),
  };

  console.log(`🕷️ [Spider Nest Lv${level}] Generated ${monsterData.type}: HP=${monster.health}, ATK=${monster.power}, ARM=${monster.armor}`);

  return [monster];
};

/**
 * Получает название монстра в зависимости от типа и уровня
 */
const getMonsterName = (type: string, level: number): string => {
  if (type === 'boss100') return `Арахна Прародительница (Lv${level})`;
  if (type === 'boss50') return `Королева Пауков (Lv${level})`;
  if (type === 'miniboss') return `Гигантский Паук-Страж (Lv${level})`;
  
  // Названия для обычных монстров в зависимости от уровня
  if (level <= 10) return `Паучок-скелет (Lv${level})`;
  if (level <= 20) return `Паук-охотник (Lv${level})`;
  if (level <= 30) return `Паук-берсерк (Lv${level})`;
  if (level <= 40) return `Теневой паук (Lv${level})`;
  if (level <= 50) return `Древний паук (Lv${level})`;
  if (level <= 60) return `Паук-титан (Lv${level})`;
  if (level <= 70) return `Ядовитый паук (Lv${level})`;
  if (level <= 80) return `Паук-некромант (Lv${level})`;
  if (level <= 90) return `Паук-архимаг (Lv${level})`;
  return `Легендарный паук (Lv${level})`;
};

/**
 * Получает изображение монстра
 */
const getMonsterImage = (type: string, level: number): string => {
  if (type === 'boss100' || type === 'boss50') {
    return monsterImagesByType.arachne_mother || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  }
  if (type === 'miniboss') {
    return monsterImagesByType.mother_guardian || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  }
  
  // Изображения для обычных монстров
  if (level <= 20) return monsterImagesByType.skeleton_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  if (level <= 40) return monsterImagesByType.hunter_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  if (level <= 60) return monsterImagesByType.titan_spider || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  if (level <= 80) return monsterImagesByType.shadow_catcher || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
  return monsterImagesByType.arachnid_archmage || "/lovable-uploads/d34cff0b-77e1-40d5-9dbc-56fb04e4e4b6.png";
};
