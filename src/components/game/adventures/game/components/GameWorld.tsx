
import React from 'react';
import { Monster } from '../../../types';

interface GameWorldProps {
  gameRef: React.RefObject<HTMLDivElement> | null;
  cameraOffset: number;
  playerPosition: number;
  playerY: number;
  isAttacking: boolean;
  currentHealth: number;
  playerPower: number;
  monsters: Monster[];
  projectiles: any[];
  onSelectTarget: (monster: Monster) => void;
  targetedMonster: any;
  armor: number;
  maxArmor: number;
  maxHealth: number;
  level?: number;
  experience?: number;
  requiredExperience?: number;
  balance: number;
}

export const GameWorld: React.FC<GameWorldProps> = ({
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
  experience,
  requiredExperience,
  balance
}) => {
  return (
    <div 
      ref={gameRef}
      className="absolute inset-0 h-full"
      style={{
        width: '100000px',
        backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat-x',
        transform: `translateX(-${cameraOffset}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <div className="fixed top-4 right-4 z-50">
        <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
      </div>

      <div className="absolute bottom-0 w-full h-[50px] bg-game-surface/50" />

      {/* Player */}
      <div 
        className="absolute"
        style={{
          left: playerPosition,
          bottom: 50 + playerY,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div 
          className={`w-16 h-20 bg-blue-500 rounded-lg flex items-center justify-center text-2xl relative ${
            isAttacking ? 'animate-pulse' : ''
          }`}
        >
          🧙‍♂️
          <div className="absolute -bottom-6 left-0 w-full">
            <div className="h-2 bg-red-900 rounded-full">
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{width: `${(currentHealth / maxHealth) * 100}%`}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monsters */}
      {monsters.map(monster => (
        <div
          key={monster.id}
          className={`absolute bottom-[50px] cursor-pointer ${
            targetedMonster?.id === monster.id ? 'ring-2 ring-red-500' : ''
          }`}
          style={{ left: monster.position }}
          onClick={() => onSelectTarget(monster)}
        >
          <div className="relative w-16 h-20">
            <div className="w-full h-full bg-red-500 rounded-lg flex items-center justify-center text-2xl">
              👾
            </div>
            <div className="absolute -bottom-6 left-0 w-full">
              <div className="h-2 bg-red-900 rounded-full">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{width: `${(monster.health / monster.maxHealth) * 100}%`}}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Projectiles */}
      {projectiles.map(projectile => (
        <div
          key={projectile.id}
          className="absolute w-4 h-4 bg-yellow-500 rounded-full"
          style={{
            left: projectile.x,
            bottom: projectile.y
          }}
        />
      ))}
    </div>
  );
};
