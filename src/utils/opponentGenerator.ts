import { Opponent } from "@/types/battle";

export const getScaledStats = (baseValue: number, level: number, isBoss: boolean = false) => {
  const levelCycle = Math.floor((level - 1) / 5) + 1;
  const levelScale = Math.pow(1.2, levelCycle - 1);
  const bossMultiplier = isBoss ? 3 : 1;
  return Math.round(baseValue * levelScale * bossMultiplier);
};

const generateRegularOpponent = (id: number, level: number, type: 'strong' | 'medium' | 'weak'): Opponent => {
  const baseStats = {
    strong: { power: 8, health: 120, name: "Элитный страж", expReward: 50 },
    medium: { power: 5, health: 80, name: "Воин тьмы", expReward: 30 },
    weak: { power: 3, health: 50, name: "Темный служитель", expReward: 20 }
  }[type];

  const health = getScaledStats(baseStats.health, level);
  
  return {
    id,
    name: baseStats.name,
    power: getScaledStats(baseStats.power, level),
    health,
    maxHealth: health,
    experienceReward: getScaledStats(baseStats.expReward, level)
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
    experienceReward: getScaledStats(150, level, true)
  };
};

export const generateOpponents = (currentLevel: number): Opponent[] => {
  const cycleLevel = ((currentLevel - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    return [generateBoss(1, currentLevel)];
  }

  const enemyCount = 6 - cycleLevel;
  const opponents: Opponent[] = [];
  
  if (cycleLevel <= 2) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'strong'));
  }
  
  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'medium'));
  }
  
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'weak'));
  }

  return opponents;
};