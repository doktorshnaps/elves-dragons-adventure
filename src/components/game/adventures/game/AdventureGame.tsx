import React, { useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { GameControls } from '../components/GameControls';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { useDiceRoll } from './hooks/useDiceRoll';
import { useMonsterSpawning } from './hooks/useMonsterSpawning';
import { GameOverlay } from './components/GameOverlay';
import { useGameState } from './hooks/useGameState';
import { GameWorldContainer } from './components/GameWorldContainer';

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
  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Add armor state
  const [armor, setArmor] = useState(50); // Base armor value
  const maxArmor = 50; // Maximum armor value

  const {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    targetedMonster,
    setTargetedMonster,
    isGameOver,
    cameraOffset,
    setCameraOffset,
    handleSelectTarget
  } = useGameState(playerHealth, onMonsterDefeat);

  const updateCameraOffset = (playerPos: number) => {
    if (!gameContainerRef.current) return;
    const containerWidth = gameContainerRef.current.offsetWidth;
    const centerPoint = containerWidth / 2;
    setCameraOffset(Math.max(0, playerPos - centerPoint));
  };

  const {
    playerPosition,
    playerY,
    isMovingRight,
    isMovingLeft,
    handleJump,
    setIsMovingRight,
    setIsMovingLeft
  } = usePlayerMovement(updateCameraOffset);

  const { monsters, setMonsters } = useMonsterSpawning(
    playerPosition,
    isMovingRight,
    isMovingLeft
  );

  const { projectiles } = useProjectiles(
    currentMonster,
    playerPosition,
    playerY,
    currentHealth,
    (damage: number) => {
      if (currentHealth > 0) {
        // First reduce armor
        if (armor > 0) {
          const remainingDamage = Math.max(0, damage - armor);
          const armorDamage = Math.min(armor, damage);
          setArmor(prev => Math.max(0, prev - armorDamage));
          
          if (remainingDamage > 0) {
            setCurrentHealth(prev => Math.max(0, prev - remainingDamage));
          }
        } else {
          // If no armor, damage goes straight to health
          setCurrentHealth(prev => Math.max(0, prev - damage));
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
    handlePlayerAttack,
    handleMonsterAttack
  } = useDiceRoll((damage: number) => {
    if (isMonsterTurn) {
      setCurrentHealth(prev => Math.max(0, prev - damage));
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
    <>
      <PlayerStatsHeader
        health={currentHealth}
        maxHealth={maxHealth}
        power={playerPower}
        level={playerLevel}
        experience={playerExperience}
        requiredExperience={requiredExperience}
        armor={armor}
        maxArmor={maxArmor}
      />
      
      <Card className="w-full h-[500px] relative overflow-hidden bg-game-background mt-4">
        <GameOverlay
          currentHealth={currentHealth}
          isRolling={isRolling}
          diceRoll={diceRoll}
          monsterDiceRoll={monsterDiceRoll}
          isMonsterTurn={isMonsterTurn}
          monsterName={monsters.find(m => m.id === targetedMonster?.id)?.name}
        />

        <div ref={gameContainerRef} className="w-full h-full relative">
          <GameWorldContainer
            gameRef={gameRef}
            cameraOffset={cameraOffset}
            playerPosition={playerPosition}
            playerY={playerY}
            isAttacking={isAttacking}
            currentHealth={currentHealth}
            playerPower={playerPower}
            monsters={monsters}
            projectiles={projectiles}
            onSelectTarget={handleSelectTarget}
            targetedMonster={targetedMonster}
            armor={armor}
            maxArmor={maxArmor}
          />
        </div>

        <GameControls
          onMoveLeft={setIsMovingLeft}
          onMoveRight={setIsMovingRight}
          onJump={handleJump}
          onAttack={handleAttack}
          isAttacking={isAttacking}
          hasTarget={!!targetedMonster}
          disabled={currentHealth <= 0 || isGameOver}
        />
      </Card>
    </>
  );
};
