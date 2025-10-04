// Новая система d6 согласно ТЗ:
// 1. Атакующий и защитник бросают по 1d6
// 2. Если атакующий > защитника: урон = (ATK атакующего) - (Armor защитника)
// 3. Если защитник >= атакующего: урон не наносится
// 4. Если равные числа: переброс кубиков (рекурсия)
// 5. Критические броски:
//    - 6 у атакующего: урон ×1.5
//    - 6 у защитника: урон не наносится + атакующий пропускает следующий ход

const rollD6 = () => Math.floor(Math.random() * 6) + 1;

export interface D6DamageResult {
  damage: number;
  attackerRoll: number;
  defenderRoll: number;
  isAttackerCrit: boolean;
  isDefenderCrit: boolean;
  skipNextTurn: boolean; // Новое поле для пропуска хода
}

export const calculateD6Damage = (attackPower: number, defenseArmor: number): D6DamageResult => {
  let attackerRoll = rollD6();
  let defenderRoll = rollD6();
  
  // Переброс при равных значениях
  while (attackerRoll === defenderRoll) {
    attackerRoll = rollD6();
    defenderRoll = rollD6();
  }
  
  const isAttackerCrit = attackerRoll === 6;
  const isDefenderCrit = defenderRoll === 6;
  
  let damage = 0;
  let skipNextTurn = false;
  
  // Если защитник выкинул 6 - полная блокировка + пропуск хода атакующего
  if (isDefenderCrit) {
    damage = 0;
    skipNextTurn = true;
  } 
  // Если атакующий > защитника
  else if (attackerRoll > defenderRoll) {
    damage = Math.max(1, attackPower - defenseArmor);
    
    // Критический удар атакующего (6) увеличивает урон на 50%
    if (isAttackerCrit) {
      damage = Math.ceil(damage * 1.5);
    }
  }
  // Если защитник >= атакующего (но не критическая защита)
  else {
    damage = 0;
  }
  
  return {
    damage,
    attackerRoll,
    defenderRoll,
    isAttackerCrit,
    isDefenderCrit,
    skipNextTurn
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