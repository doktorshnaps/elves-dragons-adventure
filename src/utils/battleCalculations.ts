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
  
  console.log(`🎲 Initial rolls: Attacker=${attackerRoll}, Defender=${defenderRoll}`);
  
  // Переброс при равных значениях
  while (attackerRoll === defenderRoll) {
    console.log(`🔄 Rerolling due to tie (both rolled ${attackerRoll})`);
    attackerRoll = rollD6();
    defenderRoll = rollD6();
    console.log(`🎲 Reroll result: Attacker=${attackerRoll}, Defender=${defenderRoll}`);
  }
  
  const isAttackerCrit = attackerRoll === 6;
  const isDefenderCrit = defenderRoll === 6;
  
  let damage = 0;
  let skipNextTurn = false;
  
  // Если защитник выкинул 6 - полная блокировка + пропуск хода атакующего
  if (isDefenderCrit) {
    damage = 0;
    skipNextTurn = true;
    console.log(`🛡️ Defender rolled 6! Attack blocked, attacker skips next turn`);
  } 
  // Если атакующий > защитника
  else if (attackerRoll > defenderRoll) {
    damage = Math.max(1, attackPower - defenseArmor);
    console.log(`⚔️ Attacker wins (${attackerRoll} > ${defenderRoll}). Base damage: ${attackPower} - ${defenseArmor} = ${damage}`);
    
    // Критический удар атакующего (6) увеличивает урон на 50%
    if (isAttackerCrit) {
      const baseDamage = damage;
      damage = Math.ceil(damage * 1.5);
      console.log(`🎯 Attacker critical hit! Damage boosted: ${baseDamage} → ${damage}`);
    }
  }
  // Если защитник >= атакующего (но не критическая защита)
  else {
    damage = 0;
    console.log(`🛡️ Defender wins (${defenderRoll} >= ${attackerRoll}). No damage dealt.`);
  }
  
  console.log(`📊 Final result: Damage=${damage}, AttackerRoll=${attackerRoll}, DefenderRoll=${defenderRoll}, SkipTurn=${skipNextTurn}`);
  
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