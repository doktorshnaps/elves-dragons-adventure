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
  const incomingDamage = enemyPower;
  const defenseReduction = Math.min(playerDefense * 0.5, incomingDamage * 0.7);
  const damageToHealth = Math.max(0, incomingDamage - defenseReduction);
  const defenseDecrease = Math.floor(playerDefense * 0.2);
  const newDefense = Math.max(0, playerDefense - defenseDecrease);

  return {
    blockedDamage: defenseReduction,
    damageToHealth,
    newDefense
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