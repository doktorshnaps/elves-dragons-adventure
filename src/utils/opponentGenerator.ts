import { Opponent } from "@/types/battle";
import { getExperienceReward } from "./experienceManager";

export const getScaledStats = (baseValue: number, level: number, isBoss: boolean = false) => {
  const levelScale = Math.pow(1.2, level - 1);
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
  // Каждый 5-й уровень - босс
  if (currentLevel % 5 === 0) {
    return [generateBoss(1, currentLevel)];
  }

  // Количество врагов увеличивается с уровнем, но не более 5
  const baseEnemyCount = Math.min(Math.floor(currentLevel / 2) + 2, 5);
  
  const opponents: Opponent[] = [];
  
  // Добавляем сильного врага каждые 3 уровня
  if (currentLevel % 3 === 0) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'strong'));
  }
  
  // Добавляем средних врагов
  const mediumCount = Math.floor(baseEnemyCount / 2);
  for (let i = 0; i < mediumCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'medium'));
  }
  
  // Добавляем слабых врагов
  const remainingCount = baseEnemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'weak'));
  }

  return opponents;
};