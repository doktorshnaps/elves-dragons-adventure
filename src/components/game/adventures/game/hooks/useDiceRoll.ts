import { useState } from 'react';
import { Monster } from '../../types';
import { useToast } from '@/hooks/use-toast';
import { getDiceMultiplier, getDiceDescription, isMiss, isCounterAttack, isCriticalHit } from '@/utils/diceFormula';

type DamageSource = 'player' | 'monster';

export const useDiceRoll = (onDamage: (damage: number, source: DamageSource) => void) => {
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

    const multiplier = getDiceMultiplier(roll);
    const damage = Math.floor(playerPower * multiplier);
    const description = getDiceDescription(roll);

    toast({
      title: `Выпало ${roll}!`,
      description: description.text
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Always pass 'player' source for player attacks
    onDamage(damage, 'player');

    // If monster survives and player rolled 1 (counterattack), monster gets a free hit
    if (monster.health > damage) {
      setIsMonsterTurn(true);
      
      if (isCounterAttack(roll)) {
        // Counterattack: monster gets guaranteed normal hit
        const counterDamage = monster.power;
        toast({
          title: 'Контратака монстра!',
          description: `Монстр наносит ответный удар за ${counterDamage} урона!`
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        onDamage(counterDamage, 'monster');
      } else {
        // Normal monster turn
        const monsterRoll = Math.floor(Math.random() * 6) + 1;
        setMonsterDiceRoll(monsterRoll);

        const monsterMultiplier = getDiceMultiplier(monsterRoll);
        const monsterDamage = Math.floor(monster.power * monsterMultiplier);
        const monsterDesc = getDiceDescription(monsterRoll);

        toast({
          title: `Монстр бросает ${monsterRoll}!`,
          description: monsterDesc.text
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        // Always pass 'monster' source for monster attacks
        onDamage(monsterDamage, 'monster');
      }
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
