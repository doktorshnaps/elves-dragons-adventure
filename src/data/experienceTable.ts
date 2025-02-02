interface LevelData {
  level: number;
  requiredXP: number;
}

export const experienceTable: LevelData[] = [
  { level: 1, requiredXP: 400 },
  { level: 2, requiredXP: 900 },
  { level: 3, requiredXP: 1400 },
  { level: 4, requiredXP: 2100 },
  { level: 5, requiredXP: 2800 },
  { level: 6, requiredXP: 3800 },
  { level: 7, requiredXP: 5000 },
  { level: 8, requiredXP: 6400 },
  { level: 9, requiredXP: 8100 },
  { level: 10, requiredXP: 9240 },
  { level: 11, requiredXP: 10780 },
  { level: 12, requiredXP: 13225 },
  { level: 13, requiredXP: 16800 },
  { level: 14, requiredXP: 20375 },
  { level: 15, requiredXP: 24440 },
  { level: 16, requiredXP: 28080 },
  { level: 17, requiredXP: 31500 },
  { level: 18, requiredXP: 34800 },
  { level: 19, requiredXP: 38550 },
  { level: 20, requiredXP: 42315 },
  // ... добавьте остальные уровни по аналогии
];

export const getRequiredExperience = (level: number): number => {
  const levelData = experienceTable.find(data => data.level === level);
  return levelData?.requiredXP || 0;
};

export const calculateLevel = (totalExperience: number): { level: number; experience: number; requiredExperience: number } => {
  let currentLevel = 1;
  
  for (let i = 0; i < experienceTable.length; i++) {
    if (totalExperience >= experienceTable[i].requiredXP) {
      currentLevel = experienceTable[i].level;
    } else {
      break;
    }
  }

  const currentLevelData = experienceTable.find(data => data.level === currentLevel);
  const nextLevelData = experienceTable.find(data => data.level === currentLevel + 1);
  
  const currentLevelXP = currentLevelData?.requiredXP || 0;
  const nextLevelXP = nextLevelData?.requiredXP || currentLevelXP;
  
  const experienceInCurrentLevel = totalExperience - currentLevelXP;
  const requiredForNextLevel = nextLevelXP - currentLevelXP;

  return {
    level: currentLevel,
    experience: experienceInCurrentLevel,
    requiredExperience: requiredForNextLevel
  };
};