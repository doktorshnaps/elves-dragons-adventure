export const calculatePlayerDamage = (attackPower: number, playerDefense: number) => {
  const blockedDamage = Math.min(attackPower, playerDefense);
  const damageToHealth = Math.max(0, attackPower - blockedDamage);
  
  return {
    blockedDamage,
    damageToHealth,
    newDefense: Math.max(0, playerDefense - attackPower)
  };
};

export const calculateDamage = (baseDamage: number) => {
  const isCritical = Math.random() < 0.1; // 10% шанс крита
  const damage = isCritical ? baseDamage * 1.5 : baseDamage;
  return { damage, isCritical };
};