import React, { useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useAdventureState } from '../hooks/useAdventureState';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { GameOver } from './GameOver';
import { useMonsterSpawning } from './hooks/useMonsterSpawning';
import { useCombatSystem } from './hooks/useCombatSystem';

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
  playerLevel,
  playerExperience,
  requiredExperience,
  maxHealth
}: AdventureGameProps) => {
  const {
    currentHealth,
    setCurrentHealth,
    monsters,
    setMonsters,
    cameraOffset,
    setCameraOffset
  } = useAdventureState(playerHealth);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

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

  useMonsterSpawning(
    isMovingRight,
    isMovingLeft,
    playerPosition,
    setMonsters,
    monsters
  );

  const {
    selectedMonster,
    isPlayerTurn,
    handleMonsterSelect,
    handleAttack
  } = useCombatSystem(
    playerPower,
    currentHealth,
    setCurrentHealth,
    monsters,
    setMonsters,
    onMonsterDefeat
  );

  return (
    <>
      <PlayerStatsHeader
        health={currentHealth}
        maxHealth={maxHealth}
        power={playerPower}
        level={playerLevel}
        experience={playerExperience}
        requiredExperience={requiredExperience}
      />
      
      <Card className="w-full h-[500px] relative overflow-hidden bg-game-background mt-4">
        {currentHealth <= 0 && <GameOver />}
        <div 
          ref={gameContainerRef}
          className="w-full h-full relative overflow-hidden"
        >
          <GameWorld
            gameRef={gameRef}
            cameraOffset={cameraOffset}
            playerPosition={playerPosition}
            playerY={playerY}
            currentHealth={currentHealth}
            playerPower={playerPower}
            monsters={monsters}
            selectedMonsterId={selectedMonster?.id}
            onMonsterSelect={handleMonsterSelect}
          />

          <div className="fixed bottom-20 right-1/2 transform translate-x-1/2 z-50">
            <Button
              onClick={handleAttack}
              disabled={!selectedMonster || currentHealth <= 0}
              className="bg-game-accent hover:bg-game-accent/90"
            >
              Атаковать выбранную цель
            </Button>
          </div>
        </div>

        <GameControls
          onMoveLeft={setIsMovingLeft}
          onMoveRight={setIsMovingRight}
          onJump={handleJump}
          onAttack={handleAttack}
          isAttacking={!isPlayerTurn}
        />
      </Card>
    </>
  );
};