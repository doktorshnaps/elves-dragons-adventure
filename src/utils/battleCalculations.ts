// Система d6 согласно ТЗ: 1d6 + ATK vs 1d6 + Armor
// Если атакующий > защитника, урон = разница
// Крит: 6 у атакующего → ×1.5 урон; 6 у защитника → ×0.5 урон

const rollD6 = () => Math.floor(Math.random() * 6) + 1;

export interface D6DamageResult {
  damage: number;
  attackerRoll: number;
  defenderRoll: number;
  isAttackerCrit: boolean;
  isDefenderCrit: boolean;
  totalAttack: number;
  totalDefense: number;
}

export const calculateD6Damage = (attackPower: number, defenseArmor: number): D6DamageResult => {
  const attackerRoll = rollD6();
  const defenderRoll = rollD6();
  
  const totalAttack = attackerRoll + attackPower;
  const totalDefense = defenderRoll + defenseArmor;
  
  const isAttackerCrit = attackerRoll === 6;
  const isDefenderCrit = defenderRoll === 6;
  
  let damage = 0;
  
  if (totalAttack > totalDefense) {
    damage = Math.max(1, totalAttack - totalDefense);
    
    // Применяем критические модификаторы
    if (isAttackerCrit) {
      damage = Math.ceil(damage * 1.5);
    }
    if (isDefenderCrit) {
      damage = Math.ceil(damage * 0.5);
    }
  } else {
    damage = 1; // Минимальный урон при неудачной атаке
  }
  
  return {
    damage,
    attackerRoll,
    defenderRoll,
    isAttackerCrit,
    isDefenderCrit,
    totalAttack,
    totalDefense
  };
};

// Старая система для совместимости (deprecated)
export const calculatePlayerDamage = (attackPower: number, playerDefense: number) => {
  const result = calculateD6Damage(attackPower, playerDefense);
  return {
    blockedDamage: 0,
    damageToHealth: result.damage,
    newDefense: playerDefense // Броня больше не уменьшается
  };
};

export const calculateDamage = (baseDamage: number) => {
  const attackerRoll = rollD6();
  const isCritical = attackerRoll === 6;
  const damage = baseDamage + attackerRoll;
  return { damage: Math.round(damage), isCritical };
};