
import React from 'react';
import { Monster, TargetedMonster } from '../types/combatTypes';
import { PlayerCharacter } from '../PlayerCharacter';
import { MonsterSprite } from '../MonsterSprite';
import { ProjectileSprite } from '../ProjectileSprite';
import { ObstacleSprite, Obstacle } from '../ObstacleSprite';

interface GameWorldProps {
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
  obstacles: Obstacle[];
  onObstacleCollision: (damage: number) => void;
  isRespawning?: boolean;
}

export const GameWorld = ({
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
  balance,
  obstacles,
  onObstacleCollision,
  isRespawning
}: GameWorldProps) => {
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

      {obstacles.map((obstacle, index) => (
        <ObstacleSprite 
          key={`obs-${obstacle.id}`} 
          obstacle={obstacle} 
        />
      ))}

      <PlayerCharacter
        position={playerPosition}
        yPosition={playerY}
        isAttacking={isAttacking}
        health={currentHealth}
        power={playerPower}
        armor={armor}
        maxArmor={maxArmor}
        maxHealth={maxHealth}
        level={level}
        experience={experience}
        requiredExperience={requiredExperience}
      />

      {monsters.map(monster => (
        <MonsterSprite
          key={monster.id}
          monster={monster}
          position={monster.position}
          onSelect={onSelectTarget}
          isTargeted={targetedMonster?.id === monster.id}
        />
      ))}

      {projectiles.map(projectile => (
        <ProjectileSprite
          key={projectile.id}
          x={projectile.x}
          y={projectile.y}
        />
      ))}
    </div>
  );
};
