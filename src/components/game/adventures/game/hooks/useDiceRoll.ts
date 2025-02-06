import { useState } from 'react';
import { Monster } from '../../types';
import { useToast } from '@/hooks/use-toast';

export const useDiceRoll = (onDamage: (damage: number) => void) => {
  const [isRolling, setIsRolling] = useState(false);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [monsterDiceRoll, setMonsterDiceRoll] = useState<number | null>(null);
  const [isMonsterTurn, setIsMonsterTurn] = useState(false);
  const { toast } = useToast();

  const handlePlayerAttack = async (monster: Monster, playerPower: number) => {
    setIsRolling(true);
    setIsMonsterTurn(false);

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceRoll(roll);

    let damage = 0;
    let message = '';

    switch (roll) {
      case 1:
        damage = 0;
        message = 'Промах! Атака не попала по цели.';
        break;
      case 2:
        damage = Math.floor(playerPower * 0.5);
        message = 'Слабый удар! Нанесено 50% урона.';
        break;
      case 3:
      case 4:
        damage = playerPower;
        message = 'Обычный удар! Нанесено 100% урона.';
        break;
      case 5:
        damage = Math.floor(playerPower * 1.5);
        message = 'Сильный удар! Нанесено 150% урона.';
        break;
      case 6:
        damage = playerPower * 2;
        message = 'Критический удар! Нанесено 200% урона.';
        break;
    }

    toast({
      title: `Выпало ${roll}!`,
      description: message
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    onDamage(damage);

    if (monster.health > damage) {
      setIsMonsterTurn(true);
      const monsterRoll = Math.floor(Math.random() * 6) + 1;
      setMonsterDiceRoll(monsterRoll);

      let monsterDamage = 0;
      let monsterMessage = '';

      switch (monsterRoll) {
        case 1:
          monsterDamage = 0;
          monsterMessage = 'Монстр промахнулся!';
          break;
        case 2:
          monsterDamage = Math.floor(monster.power * 0.5);
          monsterMessage = 'Слабая атака монстра!';
          break;
        case 3:
        case 4:
          monsterDamage = monster.power;
          monsterMessage = 'Монстр наносит обычный удар!';
          break;
        case 5:
          monsterDamage = Math.floor(monster.power * 1.5);
          monsterMessage = 'Сильная атака монстра!';
          break;
        case 6:
          monsterDamage = monster.power * 2;
          monsterMessage = 'Критическая атака монстра!';
          break;
      }

      toast({
        title: `Монстр бросает ${monsterRoll}!`,
        description: monsterMessage
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      onDamage(monsterDamage);
    }

    setIsRolling(false);
    setDiceRoll(null);
    setMonsterDiceRoll(null);
    setIsMonsterTurn(false);
  };

  return {
    isRolling,
    diceRoll,
    monsterDiceRoll,
    isMonsterTurn,
    handlePlayerAttack
  };
};