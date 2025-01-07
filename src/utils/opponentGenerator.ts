import { Opponent } from "@/types/battle";

export const getScaledStats = (baseValue: number, level: number, isBoss: boolean = false) => {
  const levelScale = Math.pow(1.2, level - 1);
  const bossMultiplier = isBoss ? 3 : 1;
  return Math.round(baseValue * levelScale * bossMultiplier);
};

export const generateOpponents = (currentLevel: number): Opponent[] => {
  const isBossWave = currentLevel % 5 === 0;
  
  if (isBossWave) {
    return [{
      id: 1,
      name: "🔥 Босс Древний Дракон",
      power: getScaledStats(10, currentLevel, true),
      health: getScaledStats(200, currentLevel, true),
      maxHealth: getScaledStats(200, currentLevel, true),
      isBoss: true,
      experienceReward: getScaledStats(100, currentLevel, true)
    }];
  }

  return [
    { 
      id: 1, 
      name: "Дракон", 
      power: getScaledStats(5, currentLevel), 
      health: getScaledStats(100, currentLevel),
      maxHealth: getScaledStats(100, currentLevel),
      experienceReward: getScaledStats(30, currentLevel)
    },
    { 
      id: 2, 
      name: "Тролль", 
      power: getScaledStats(3, currentLevel),
      health: getScaledStats(70, currentLevel),
      maxHealth: getScaledStats(70, currentLevel),
      experienceReward: getScaledStats(20, currentLevel)
    },
    { 
      id: 3, 
      name: "Гоблин", 
      power: getScaledStats(2, currentLevel),
      health: getScaledStats(50, currentLevel),
      maxHealth: getScaledStats(50, currentLevel),
      experienceReward: getScaledStats(15, currentLevel)
    },
  ];
};