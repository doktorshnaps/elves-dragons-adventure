export type AttackResult = {
  type: 'block' | 'normal' | 'critical' | 'counter' | 'weak' | 'fatal';
  damage: number;
  message: string;
};

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const calculateAttackResult = (baseDamage: number): AttackResult => {
  const roll = rollDice();
  
  switch (roll) {
    case 1:
      return {
        type: 'block',
        damage: 0,
        message: 'Враг заблокировал атаку!'
      };
    case 2:
      return {
        type: 'normal',
        damage: baseDamage,
        message: 'Обычная атака'
      };
    case 3:
      return {
        type: 'critical',
        damage: Math.floor(baseDamage * 1.3),
        message: 'Критический удар!'
      };
    case 4:
      return {
        type: 'counter',
        damage: -baseDamage, // Отрицательный урон означает урон игроку
        message: 'Враг парировал атаку!'
      };
    case 5:
      return {
        type: 'weak',
        damage: Math.floor(baseDamage * 0.7),
        message: 'Слабая атака'
      };
    case 6:
      return {
        type: 'fatal',
        damage: baseDamage * 2,
        message: 'Фатальная атака!'
      };
    default:
      return {
        type: 'normal',
        damage: baseDamage,
        message: 'Обычная атака'
      };
  }
};