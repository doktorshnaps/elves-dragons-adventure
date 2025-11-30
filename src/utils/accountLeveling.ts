/**
 * Система прокачки аккаунта игрока
 */

// Константы для расчета опыта
const RACE_CLASS_MODIFIER = 1.0; // Для упрощения
const XP_60 = 1302000; // Опыт для 60 уровня (130200 * 10)
const LOGARITHM_MULTIPLIER = 250000;

/**
 * Вычисляет необходимый опыт для достижения указанного уровня
 */
export const calculateRequiredXP = (level: number): number => {
  if (level <= 1) return 0;
  
  if (level <= 60) {
    // Формула для уровней 1–60: XP_required = (8 × Level² + 40 × Level) × Race_Class_Modifier × 10
    const baseXP = (8 * Math.pow(level - 1, 2) + 40 * (level - 1)) * RACE_CLASS_MODIFIER;
    // Применяем округление и умножаем на 10 для увеличения сложности
    return Math.round(baseXP * 8.33 * 10);
  } else {
    // Формула для уровней 60–100: XP_required = XP_60 + (250,000 × ln(Level - 59)) × 10
    return Math.round((XP_60 + (LOGARITHM_MULTIPLIER * Math.log(level - 59))) * 10);
  }
};

/**
 * Вычисляет общий опыт, необходимый для достижения уровня (сумма всех предыдущих уровней)
 */
export const calculateTotalXPForLevel = (level: number): number => {
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += calculateRequiredXP(i);
  }
  return totalXP;
};

/**
 * Определяет текущий уровень на основе накопленного опыта
 */
export const getLevelFromXP = (experience: number): number => {
  let level = 1;
  let totalXP = 0;
  
  while (level < 100) {
    const xpForNextLevel = calculateRequiredXP(level + 1);
    if (totalXP + xpForNextLevel > experience) {
      break;
    }
    totalXP += xpForNextLevel;
    level++;
  }
  
  return level;
};

/**
 * Вычисляет прогресс до следующего уровня
 */
export const getXPProgress = (experience: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} => {
  const currentLevel = getLevelFromXP(experience);
  const totalXPForCurrentLevel = calculateTotalXPForLevel(currentLevel);
  const xpForNextLevel = calculateRequiredXP(currentLevel + 1);
  const currentLevelXP = experience - totalXPForCurrentLevel;
  
  const progress = Math.min(currentLevelXP / xpForNextLevel, 1);
  
  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP: xpForNextLevel,
    progress
  };
};

/**
 * Добавляет опыт и возвращает информацию о повышении уровня
 */
export const addAccountExperience = (currentXP: number, addedXP: number): {
  newXP: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
} => {
  const oldLevel = getLevelFromXP(currentXP);
  const newXP = currentXP + addedXP;
  const newLevel = getLevelFromXP(newXP);
  
  return {
    newXP,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel
  };
};