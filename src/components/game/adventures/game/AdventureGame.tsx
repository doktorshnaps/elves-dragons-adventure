import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { useAdventureState } from '../hooks/useAdventureState';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';

interface AdventureGameProps {
  onMonsterDefeat: (monster: Monster) => void;
  playerHealth: number;
  playerPower: number;
  currentMonster: Monster | null;
}

export const AdventureGame = ({ 
  onMonsterDefeat, 
  playerHealth,
  playerPower,
  currentMonster 
}: AdventureGameProps) => {
  const {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    monsters,
    setMonsters,
    cameraOffset,
    setCameraOffset,
    generateMonster
  } = useAdventureState(playerHealth);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastMonsterSpawn = useRef(0);

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

  const handleProjectileHit = (damage: number) => {
    setCurrentHealth(prev => Math.max(0, prev - damage));
  };

  const { projectiles } = useProjectiles(
    currentMonster,
    playerPosition,
    playerY,
    currentHealth,
    handleProjectileHit
  );

  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastMonsterSpawn.current > 2000) {
      const spawnDistance = isMovingRight ? playerPosition + 400 : playerPosition - 400;
      
      if ((isMovingRight && spawnDistance > playerPosition) || 
          (isMovingLeft && spawnDistance < playerPosition)) {
        const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
        const newMonster = generateMonster(spawnDistance);
        
        newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
        newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
        newMonster.maxHealth = newMonster.health;
        
        setMonsters(prev => [...prev, newMonster]);
        lastMonsterSpawn.current = currentTime;
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster]);

  useEffect(() => {
    setMonsters(prev => prev.filter(monster => 
      Math.abs(monster.position! - playerPosition) < 800
    ));
  }, [playerPosition]);

  const handleAttack = () => {
    if (isAttacking || !currentMonster) return;
    
    setIsAttacking(true);
    setTimeout(() => {
      setIsAttacking(false);
      if (currentMonster && Math.abs(playerPosition - 400) < 100) {
        const damage = Math.max(1, playerPower + Math.floor(Math.random() * 3));
        const updatedMonster = {
          ...currentMonster,
          health: Math.max(0, currentMonster.health - damage)
        };
        onMonsterDefeat(updatedMonster);
      }
    }, 500);
  };

  return (
    <>
      <PlayerStatsHeader
        health={currentHealth}
        maxHealth={100}
        power={playerPower}
        level={1}
        experience={0}
        requiredExperience={100}
      />
      
      <Card className="w-full h-[500px] relative overflow-hidden bg-game-background mt-12">
        <div 
          ref={gameContainerRef}
          className="w-full h-full relative overflow-hidden"
        >
          <GameWorld
            gameRef={gameRef}
            cameraOffset={cameraOffset}
            playerPosition={playerPosition}
            playerY={playerY}
            isAttacking={isAttacking}
            currentHealth={currentHealth}
            playerPower={playerPower}
            monsters={monsters}
            projectiles={projectiles}
          />
        </div>

        <GameControls
          onMoveLeft={setIsMovingLeft}
          onMoveRight={setIsMovingRight}
          onJump={handleJump}
          onAttack={handleAttack}
          isAttacking={isAttacking}
        />
      </Card>
    </>
  );
};