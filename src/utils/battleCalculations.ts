import { PlayerStats } from "@/types/battle";

export const calculateDamage = (power: number) => {
  const baseDamage = power;
  const randomFactor = Math.random() * 0.4 + 0.8; // 80-120% от базового урона
  const isCritical = Math.random() < 0.2; // 20% шанс крита
  const criticalMultiplier = isCritical ? 1.5 : 1;
  
  const finalDamage = Math.floor(baseDamage * randomFactor * criticalMultiplier);
  
  return {
    damage: finalDamage,
    isCritical
  };
};

export const calculatePlayerDamage = (
  enemyPower: number,
  playerDefense: number
) => {
  const incomingDamage = Math.floor(enemyPower);
  
  // Если есть защита, сначала снимаем её
  if (playerDefense > 0) {
    const damageToDefense = Math.min(playerDefense, incomingDamage);
    const remainingDamage = Math.max(0, incomingDamage - damageToDefense);
    const newDefense = Math.max(0, playerDefense - damageToDefense);
    
    return {
      blockedDamage: damageToDefense,
      damageToHealth: remainingDamage,
      newDefense: newDefense
    };
  }
  
  // Если защиты нет, весь урон идёт по здоровью
  return {
    blockedDamage: 0,
    damageToHealth: incomingDamage,
    newDefense: 0
  };
};

export const calculateExperience = (
  currentLevel: number,
  currentExperience: number,
  gainedExperience: number
): {
  newExperience: number;
  newLevel: number;
  requiredExperience: number;
} => {
  const baseRequiredExperience = 100;
  const requiredExperience = Math.floor(baseRequiredExperience * Math.pow(1.5, currentLevel - 1));
  
  let totalExperience = currentExperience + gainedExperience;
  let newLevel = currentLevel;
  
  while (totalExperience >= requiredExperience) {
    totalExperience -= requiredExperience;
    newLevel++;
  }
  
  return {
    newExperience: totalExperience,
    newLevel,
    requiredExperience
  };
};