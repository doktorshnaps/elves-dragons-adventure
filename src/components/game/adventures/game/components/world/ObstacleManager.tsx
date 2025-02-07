
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
    if (playerY === 0) {
      const playerWidth = 48;
      const playerLeft = playerPosition;
      const playerRight = playerPosition + playerWidth;
      const playerBounds = {
        left: playerLeft,
        right: playerRight,
        top: playerY,
        bottom: playerY + 64
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

  return null;
};

