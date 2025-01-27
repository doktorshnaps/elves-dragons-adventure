export const calculatePlayerDamage = (attackPower: number, playerDefense: number) => {
  const blockedDamage = Math.min(attackPower, playerDefense);
  const damageToHealth = Math.max(0, attackPower - blockedDamage);
  const defenseReduction = Math.min(playerDefense, Math.ceil(attackPower * 0.5));
  
  return {
    blockedDamage,
    damageToHealth,
    newDefense: Math.max(0, playerDefense - defenseReduction)
  };
};

export const calculateDamage = (baseDamage: number) => {
  const isCritical = Math.random() < 0.1; // 10% шанс крита
  const randomFactor = 0.8 + Math.random() * 0.4; // Случайный множитель от 0.8 до 1.2
  const damage = isCritical ? baseDamage * 1.5 * randomFactor : baseDamage * randomFactor;
  return { damage: Math.round(damage), isCritical };
};