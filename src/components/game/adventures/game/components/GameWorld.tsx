
import React, { useEffect } from 'react';
import { Monster } from '../../../types';
import { PlayerCharacter } from '../PlayerCharacter';
import { MonsterSprite } from '../MonsterSprite';
import { ProjectileSprite } from '../ProjectileSprite';
import { ObstacleSprite, Obstacle } from '../ObstacleSprite';
import { TargetedMonster } from '../types/combatTypes';
import { useToast } from '@/hooks/use-toast';

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
  onObstacleCollision
}: GameWorldProps) => {
  const { toast } = useToast();

  // Enhanced collision detection with proper hit boxes and trap triggering
  useEffect(() => {
    if (playerY === 0) { // Only check when player is on the ground
      const playerWidth = 48; // Width of player character
      const playerLeft = playerPosition;
      const playerRight = playerPosition + playerWidth;
      const playerBounds = {
        left: playerLeft,
        right: playerRight,
        top: playerY,
        bottom: playerY + 64 // Player height
      };

      const collided = obstacles.find(obstacle => {
        if (obstacle.triggered) return false;

        const obstacleWidth = obstacle.type === 'pit' ? 64 : 32;
        const obstacleHeight = obstacle.type === 'pit' ? 48 : 48;
        const obstacleBounds = {
          left: obstacle.position,
          right: obstacle.position + obstacleWidth,
          top: 0,
          bottom: obstacleHeight
        };

        // Check for rectangle collision
        const collision = !(playerBounds.right < obstacleBounds.left || 
                playerBounds.left > obstacleBounds.right || 
                playerBounds.bottom < obstacleBounds.top || 
                playerBounds.top > obstacleBounds.bottom);

        if (collision) {
          obstacle.triggered = true;
          return true;
        }

        return false;
      });

      if (collided) {
        onObstacleCollision(collided.damage);
        toast({
          title: "Внимание!",
          description: `Вы получили ${collided.damage} урона от ${collided.type === 'spike' ? 'шипов' : 'ямы'}`,
          variant: "destructive"
        });
      }
    }
  }, [playerPosition, playerY, obstacles, onObstacleCollision, toast]);

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

      {obstacles.map(obstacle => (
        <ObstacleSprite key={obstacle.id} obstacle={obstacle} />
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
          position={monster.position || 400}
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

