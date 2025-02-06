import React from 'react';
import { Monster } from '../../types';
import { GameWorld } from '../../components/GameWorld';
import { TargetedMonster } from '../types/combatTypes';

interface GameWorldContainerProps {
  gameRef: React.RefObject<HTMLDivElement>;
  cameraOffset: number;
  playerPosition: number;
  playerY: number;
  isAttacking: boolean;
  currentHealth: number;
  playerPower: number;
  monsters: Monster[];
  projectiles: any[];
  onSelectTarget: (monster: Monster) => void;
  targetedMonster: TargetedMonster | null;
  armor: number;
  maxArmor: number;
}

export const GameWorldContainer = ({
  gameRef,
  cameraOffset,
  playerPosition,
  playerY,
  isAttacking,
  currentHealth,
  playerPower,
  monsters,
  projectiles,
  onSelectTarget,
  targetedMonster,
  armor,
  maxArmor
}: GameWorldContainerProps) => {
  return (
    <div className="w-full h-full relative overflow-hidden">
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
        onSelectTarget={onSelectTarget}
        targetedMonster={targetedMonster}
        armor={armor}
        maxArmor={maxArmor}
      />
    </div>
  );
};