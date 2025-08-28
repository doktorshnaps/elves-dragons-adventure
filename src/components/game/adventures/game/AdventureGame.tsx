
import React from 'react';
import { Monster } from '../types';
import { useProjectiles } from './hooks/useProjectiles';
import { useDiceRoll } from './hooks/useDiceRoll';
import { useMonsterSpawning } from './hooks/useMonsterSpawning';
import { useGameState } from './hooks/useGameState';
import { GameContainer } from './components/GameContainer';
import { useToast } from '@/hooks/use-toast';
import { useBalanceState } from '@/hooks/useBalanceState';
import { useTeamDamageSync } from '@/hooks/adventure/useTeamDamageSync';

interface AdventureGameProps {
  onMonsterDefeat: (monster: Monster) => void;
  playerHealth: number;
  playerPower: number;
  currentMonster: Monster | null;
  playerLevel: number;
  playerExperience: number;
  requiredExperience: number;
  maxHealth: number;
}

export const AdventureGame = ({
  onMonsterDefeat,
  playerHealth,
  playerPower,
  currentMonster,
  playerLevel,
  playerExperience,
  requiredExperience,
  maxHealth
}: AdventureGameProps) => {
  const [armor, setArmor] = React.useState(50);
  const maxArmor = 50;
  const { toast } = useToast();
  const { balance } = useBalanceState();
  const { applyDamageToTeam } = useTeamDamageSync();

  const {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    targetedMonster,
    setTargetedMonster
  } = useGameState(playerHealth, onMonsterDefeat);

  const { monsters, setMonsters } = useMonsterSpawning(currentMonster?.position || 0, !!currentMonster, false);

  const handleSelectTarget = (monster: Monster) => {
    console.log("Selecting target:", monster);
    setTargetedMonster({
      id: monster.id,
      position: monster.position
    });
    
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран целью для атаки`
    });
  };

  const { projectiles } = useProjectiles(
    currentMonster,
    0,
    0,
    currentHealth,
    (damage: number) => {
      if (currentHealth > 0) {
        if (armor > 0) {
          const remainingDamage = Math.max(0, damage - armor);
          const armorDamage = Math.min(armor, damage);
          setArmor(prev => Math.max(0, prev - armorDamage));
          
          if (remainingDamage > 0) {
            setCurrentHealth(prev => Math.max(0, prev - remainingDamage));
            // Sync damage to team cards
            applyDamageToTeam(remainingDamage);
          }
        } else {
          setCurrentHealth(prev => Math.max(0, prev - damage));
          // Sync damage to team cards
          applyDamageToTeam(damage);
        }
      }
    },
    monsters
  );

  const handleMonsterDamage = (damage: number) => {
    if (!targetedMonster) return;

    const updatedMonsters = monsters.map(m => {
      if (m.id === targetedMonster.id) {
        const newHealth = Math.max(0, m.health - damage);
        if (newHealth <= 0) {
          onMonsterDefeat(m);
          setTargetedMonster(null);
          return null;
        }
        return { ...m, health: newHealth };
      }
      return m;
    }).filter(Boolean) as Monster[];

    setMonsters(updatedMonsters);
    setIsAttacking(false);
  };

  const {
    isRolling,
    diceRoll,
    monsterDiceRoll,
    isMonsterTurn,
    handlePlayerAttack
  } = useDiceRoll((damage: number) => {
    if (isMonsterTurn) {
      setCurrentHealth(prev => Math.max(0, prev - damage));
      // Sync damage to team cards
      applyDamageToTeam(damage);
    } else {
      handleMonsterDamage(damage);
    }
  });

  const handleAttack = async () => {
    if (!targetedMonster || isRolling || currentHealth <= 0) return;
    setIsAttacking(true);
    const monster = monsters.find(m => m.id === targetedMonster.id);
    if (monster) {
      await handlePlayerAttack(monster, playerPower);
    }
  };

  return (
    <GameContainer
      currentHealth={currentHealth}
      maxHealth={maxHealth}
      playerPower={playerPower}
      isRolling={isRolling}
      diceRoll={diceRoll}
      monsterDiceRoll={monsterDiceRoll}
      isMonsterTurn={isMonsterTurn}
      monsters={monsters}
      targetedMonster={targetedMonster}
      onAttack={handleAttack}
      isAttacking={isAttacking}
      playerLevel={playerLevel}
      playerExperience={playerExperience}
      requiredExperience={requiredExperience}
      armor={armor}
      maxArmor={maxArmor}
      onSelectTarget={handleSelectTarget}
      balance={balance}
    />
  );
};

