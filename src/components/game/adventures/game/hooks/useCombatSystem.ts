import { useState } from 'react';
import { Monster } from '../../types';
import { TargetedMonster } from '../types/combatTypes';
import { rollDice, getDiceResult } from '../utils/combatUtils';
import { useToast } from '@/hooks/use-toast';

export const useCombatSystem = (
  playerPower: number,
  setCurrentHealth: (health: number) => void,
  currentHealth: number,
  setMonsters: (monsters: Monster[]) => void,
  monsters: Monster[]
) => {
  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);
  const { toast } = useToast();

  const selectTarget = (monster: Monster) => {
    setTargetedMonster({
      id: monster.id,
      position: monster.position || 0
    });
    
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран целью для атаки`,
    });
  };

  const attack = () => {
    if (!targetedMonster) {
      toast({
        title: "Ошибка",
        description: "Выберите цель для атаки",
        variant: "destructive"
      });
      return;
    }

    const roll = rollDice();
    const result = getDiceResult(roll);
    
    toast({
      title: `Выпало ${roll}!`,
      description: result.description,
    });

    const updatedMonsters = monsters.map(monster => {
      if (monster.id === targetedMonster.id) {
        const damage = Math.floor(playerPower * result.damageModifier);
        const newHealth = monster.health - (result.isBlocked ? 0 : damage);

        if (!result.isBlocked) {
          toast({
            title: "Атака!",
            description: `Нанесено ${damage} урона!`,
          });
        }

        if (result.isCounterAttack) {
          const counterDamage = Math.floor(monster.power * 0.5);
          const newPlayerHealth = Math.max(0, currentHealth - counterDamage);
          setCurrentHealth(newPlayerHealth);
          
          toast({
            title: "Контратака!",
            description: `Враг наносит ${counterDamage} урона!`,
            variant: "destructive"
          });
        }

        return {
          ...monster,
          health: Math.max(0, newHealth)
        };
      }
      return monster;
    });

    setMonsters(updatedMonsters.filter(monster => monster.health > 0));
    setTargetedMonster(null);
  };

  return {
    targetedMonster,
    selectTarget,
    attack
  };
};