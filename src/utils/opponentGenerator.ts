import { Opponent } from "@/types/battle";

export const getScaledStats = (baseValue: number, level: number, type: 'normal' | 'elite' | 'boss' = 'normal') => {
  const levelScale = 1 + ((level - 1) * 0.2); // Увеличение на 20% за уровень
  let multiplier = 1;

  switch (type) {
    case 'elite':
      multiplier = 1.6; // +60% для элитных врагов
      break;
    case 'boss':
      multiplier = 3; // +300% для боссов
      break;
    default:
      multiplier = 1;
  }

  return Math.round(baseValue * levelScale * multiplier);
};

const generateRegularOpponent = (id: number, level: number, type: 'normal' | 'elite'): Opponent => {
  const baseStats = {
    normal: { power: 8, health: 120, name: "Воин тьмы" },
    elite: { power: 12, health: 180, name: "Элитный страж" }
  }[type];

  const health = getScaledStats(baseStats.health, level, type);
  
  return {
    id,
    name: baseStats.name,
    power: getScaledStats(baseStats.power, level, type),
    health,
    maxHealth: health
  };
};

const generateBoss = (id: number, level: number): Opponent => {
  const health = getScaledStats(200, level, 'boss');
  
  return {
    id,
    name: "🔥 Босс подземелья",
    power: getScaledStats(12, level, 'boss'),
    health,
    maxHealth: health,
    isBoss: true
  };
};

export const generateOpponents = (currentLevel: number): Opponent[] => {
  const opponents: Opponent[] = [];
  
  // Каждый 5-й уровень - босс
  if (currentLevel % 5 === 0) {
    return [generateBoss(1, currentLevel)];
  }

  // Каждый 3-й уровень - элитные враги
  if (currentLevel % 3 === 0) {
    // Добавляем 1-2 элитных врага
    const eliteCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < eliteCount; i++) {
      opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'elite'));
    }
  }

  // Добавляем обычных врагов (2-4 врага)
  const normalCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < normalCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'normal'));
  }

  return opponents;
};