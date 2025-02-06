
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
  maxHealth: number;
  level?: number;
  experience?: number;
  requiredExperience?: number;
  balance: number;
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
  maxArmor,
  maxHealth,
  level,
  experience = 0,
  requiredExperience = 100,
  balance
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
        maxHealth={maxHealth}
        level={level}
        experience={experience}
        requiredExperience={requiredExperience}
        balance={balance}
      />

      {/* Player Interface */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-2">
        <div className="max-w-[400px] mx-auto space-y-2">
          {/* Health Bar */}
          <div className="w-full h-4 bg-red-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300 relative"
              style={{ width: `${(currentHealth / maxHealth) * 100}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                {Math.floor(currentHealth)}/{maxHealth} HP
              </div>
            </div>
          </div>

          {/* Armor Bar */}
          <div className="w-full h-4 bg-blue-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300 relative"
              style={{ width: `${(armor / maxArmor) * 100}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                ARMOR {Math.floor(armor)}/{maxArmor}
              </div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="w-full h-4 bg-purple-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all duration-300 relative"
              style={{ width: `${(experience / requiredExperience) * 100}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                EXP {experience}/{requiredExperience}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

