import { Opponent } from "@/types/battle";

export const getScaledStats = (baseValue: number, level: number, isBoss: boolean = false) => {
  const levelCycle = Math.floor((level - 1) / 5) + 1;
  const levelScale = Math.pow(1.2, levelCycle - 1);
  const bossMultiplier = isBoss ? 3 : 1;
  return Math.round(baseValue * levelScale * bossMultiplier);
};

const generateRegularOpponent = (id: number, level: number, type: 'strong' | 'medium' | 'weak'): Opponent => {
  const baseStats = {
    strong: { 
      power: 8, 
      health: 120, 
      names: ["Элитный страж", "Темный рыцарь", "Древний воин"]
    },
    medium: { 
      power: 5, 
      health: 80, 
      names: ["Воин тьмы", "Призрачный мечник", "Проклятый страж"]
    },
    weak: { 
      power: 3, 
      health: 50, 
      names: ["Темный служитель", "Скелет-воин", "Порченый прислужник"]
    }
  }[type];

  const health = getScaledStats(baseStats.health, level);
  const randomName = baseStats.names[Math.floor(Math.random() * baseStats.names.length)];
  
  return {
    id,
    name: randomName,
    power: getScaledStats(baseStats.power, level),
    health,
    maxHealth: health
  };
};

const generateBoss = (id: number, level: number): Opponent => {
  const bossTypes = [
    { name: "🔥 Древний Дракон", powerMod: 1, healthMod: 1 },
    { name: "💀 Повелитель Нежити", powerMod: 1.2, healthMod: 0.9 },
    { name: "⚔️ Темный Полководец", powerMod: 0.9, healthMod: 1.3 }
  ];

  const boss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
  const baseHealth = getScaledStats(200, level, true) * boss.healthMod;
  
  return {
    id,
    name: boss.name,
    power: getScaledStats(12, level, true) * boss.powerMod,
    health: baseHealth,
    maxHealth: baseHealth,
    isBoss: true
  };
};

export const generateOpponents = (currentLevel: number): Opponent[] => {
  const cycleLevel = ((currentLevel - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    return [generateBoss(1, currentLevel)];
  }

  // Увеличиваем количество врагов
  const enemyCount = Math.min(8, 4 + Math.floor(currentLevel / 3));
  const opponents: Opponent[] = [];
  
  // Добавляем сильных врагов
  const strongCount = Math.floor(enemyCount * 0.3);
  for (let i = 0; i < strongCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'strong'));
  }
  
  // Добавляем средних врагов
  const mediumCount = Math.floor(enemyCount * 0.4);
  for (let i = 0; i < mediumCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'medium'));
  }
  
  // Добавляем слабых врагов
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    opponents.push(generateRegularOpponent(opponents.length + 1, currentLevel, 'weak'));
  }

  return opponents;
};