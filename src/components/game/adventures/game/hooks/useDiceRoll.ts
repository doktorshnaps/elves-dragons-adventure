import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Monster } from '../../types';

export const useDiceRoll = (onDamageCalculated: (damage: number) => void) => {
  const [isRolling, setIsRolling] = useState(false);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [monsterDiceRoll, setMonsterDiceRoll] = useState<number | null>(null);
  const [isMonsterTurn, setIsMonsterTurn] = useState(false);
  const { toast } = useToast();

  const rollDice = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const handlePlayerAttack = async (monster: Monster, playerPower: number) => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 20) + 1);
    }, 50);

    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(interval);

    const finalRoll = rollDice();
    setDiceRoll(finalRoll);

    await new Promise(resolve => setTimeout(resolve, 500));

    let damageMultiplier = 1;
    if (finalRoll === 20) {
      damageMultiplier = 2;
      toast({
        title: "Критический удар!",
        description: `Выпало ${finalRoll}! Двойной урон!`,
        variant: "destructive"
      });
    } else if (finalRoll === 1) {
      damageMultiplier = 0;
      toast({
        title: "Промах!",
        description: "Выпало 1! Атака не попала по цели.",
      });
    } else {
      toast({
        title: "Атака!",
        description: `Выпало ${finalRoll}!`,
      });
    }

    const damage = Math.floor(playerPower * damageMultiplier);
    onDamageCalculated(damage);

    setIsRolling(false);
    setDiceRoll(null);
  };

  const handleMonsterAttack = async (monster: Monster) => {
    setIsMonsterTurn(true);
    setIsRolling(true);

    const interval = setInterval(() => {
      setMonsterDiceRoll(Math.floor(Math.random() * 20) + 1);
    }, 50);

    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(interval);
    
    const finalRoll = rollDice();
    setMonsterDiceRoll(finalRoll);

    await new Promise(resolve => setTimeout(resolve, 500));

    let damageMultiplier = 1;
    if (finalRoll === 20) {
      damageMultiplier = 2;
      toast({
        title: "Критический удар монстра!",
        description: `${monster.name} выбросил ${finalRoll}! Двойной урон!`,
        variant: "destructive"
      });
    } else if (finalRoll === 1) {
      damageMultiplier = 0;
      toast({
        title: "Монстр промахнулся!",
        description: `${monster.name} выбросил 1 и промахнулся!`,
      });
    } else {
      toast({
        title: "Атака монстра!",
        description: `${monster.name} выбросил ${finalRoll}!`,
      });
    }

    const damage = Math.floor(monster.power * damageMultiplier);
    onDamageCalculated(damage);

    setIsMonsterTurn(false);
    setIsRolling(false);
    setMonsterDiceRoll(null);
  };

  return {
    isRolling,
    diceRoll,
    monsterDiceRoll,
    isMonsterTurn,
    handlePlayerAttack,
    handleMonsterAttack
  };
};