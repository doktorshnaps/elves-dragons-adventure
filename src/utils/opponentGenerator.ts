import { Opponent } from "@/types/battle";
import { getExperienceReward } from "./experienceManager";

export const getScaledStats = (baseValue: number, level: number, isBoss: boolean = false) => {
  const levelCycle = Math.floor((level - 1) / 5) + 1; // Определяем цикл (каждые 5 уровней)
  const levelScale = Math.pow(1.2, levelCycle - 1); // Увеличиваем силу с каждым циклом
  const bossMultiplier = isBoss ? 3 : 1;
  return Math.round(baseValue * levelScale * bossMultiplier);
};

const generateRegularOpponent = (id: number, level: number, type: 'strong' | 'medium' | 'weak'): Opponent => {
  const baseStats = {
    strong: { power: 8, health: 120, name: "Элитный страж" },
    medium: { power: 5, health: 80, name: "Воин тьмы" },
    weak: { power: 3, health: 50, name: "Темный служитель" }
  }[type];

  const health = getScaledStats(baseStats.health, level);
  
  return {
    id,
    name: baseStats.name,
    power: getScaledStats(baseStats.power, level),
    health,
    maxHealth: health,
    experienceReward: getExperienceReward(level, false)
  };
};

const generateBoss = (id: number, level: number): Opponent => {
  const health = getScaledStats(200, level, true);
  
  return {
    id,
    name: "🔥 Древний Дракон",
    power: getScaledStats(12, level, true),
    health,
    maxHealth: health,
    isBoss: true,
    experienceReward: getExperienceReward(level, true)
  };
};

export const generateOpponents = (currentLevel: number): Opponent[] => {
  // Определяем текущий уровень в цикле (1-5)
  const cycleLevel = ((currentLevel - 1) % 5) + 1;
  
  // Если это 5-й уровень в цикле - генерируем босса
  if (cycleLevel === 5) {
    return [generateBoss(1, currentLevel)];
  }

  // Количество монстров уменьшается с каждым уровнем в цикле
  const enemyCount = 6 - cycleLevel; // 5 на 1-м уровне, 4 на 2-м и т.д.
  
  const opponents: Opponent[] = [];
  
  // Добавляем сильного врага на первых двух уровнях цикла
  if (cycleLevel <= 2) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'strong'));
  }
  
  // Добавляем средних врагов
  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'medium'));
  }
  
  // Добавляем оставшихся слабых врагов
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'weak'));
  }

  return opponents;
};