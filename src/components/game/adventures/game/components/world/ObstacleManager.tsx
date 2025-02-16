
import React, { useEffect } from 'react';
import { Obstacle } from '../../ObstacleSprite';
import { useToast } from '@/hooks/use-toast';

interface ObstacleManagerProps {
  obstacles: Obstacle[];
  playerPosition: number;
  playerY: number;
  onObstacleCollision: (damage: number) => void;
}

export const ObstacleManager = ({
  obstacles,
  playerPosition,
  playerY,
  onObstacleCollision
}: ObstacleManagerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    // Check for collisions on every frame when player is on the ground
    const playerWidth = 48;
    const playerHeight = 64;
    const playerBounds = {
      left: playerPosition,
      right: playerPosition + playerWidth,
      top: playerY,
      bottom: playerY + playerHeight
    };

    obstacles.forEach(obstacle => {
      if (obstacle.triggered) return;

      const obstacleWidth = obstacle.type === 'pit' ? 64 : 32;
      const obstacleHeight = 48;
      const obstacleBounds = {
        left: obstacle.position,
        right: obstacle.position + obstacleWidth,
        top: 0,
        bottom: obstacleHeight
      };

      // Check for collision using AABB (Axis-Aligned Bounding Box)
      const hasCollision = !(
        playerBounds.right < obstacleBounds.left ||
        playerBounds.left > obstacleBounds.right ||
        playerBounds.bottom < obstacleBounds.top ||
        playerBounds.top > obstacleBounds.bottom
      );

      if (hasCollision && playerY <= obstacleHeight) {
        obstacle.triggered = true;
        const damage = obstacle.type === 'spike' ? 20 : 10; // Spikes deal more damage than pits
        onObstacleCollision(damage);
        
        toast({
          title: "Внимание!",
          description: `Вы получили ${damage} урона от ${
            obstacle.type === 'spike' ? 'шипов' : 'ямы'
          }`,
          variant: "destructive",
          duration: 3000
        });
        
        console.log(`Collision detected with ${obstacle.type}, damage: ${damage}`);
      }
    });
  }, [playerPosition, playerY, obstacles, onObstacleCollision, toast]);

  return null;
};
