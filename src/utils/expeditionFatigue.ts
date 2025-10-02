// Система усталости похода согласно ТЗ
// +5% к входящему урону на 20/40/60/80 уровнях данного подземелья

export const calculateFatigueModifier = (currentLevel: number): number => {
  let fatigueStacks = 0;
  
  // Проверяем каждый порог усталости
  if (currentLevel >= 80) fatigueStacks = 4;
  else if (currentLevel >= 60) fatigueStacks = 3;
  else if (currentLevel >= 40) fatigueStacks = 2;
  else if (currentLevel >= 20) fatigueStacks = 1;
  
  // Каждый стек добавляет 5% к входящему урону
  return 1 + (fatigueStacks * 0.05);
};

export const applyFatigueDamage = (baseDamage: number, currentLevel: number): number => {
  const modifier = calculateFatigueModifier(currentLevel);
  return Math.ceil(baseDamage * modifier);
};

export const getFatigueDescription = (currentLevel: number): string => {
  const modifier = calculateFatigueModifier(currentLevel);
  if (modifier === 1) return '';
  
  const percentage = Math.round((modifier - 1) * 100);
  return `⚠️ Усталость: +${percentage}% урона`;
};
