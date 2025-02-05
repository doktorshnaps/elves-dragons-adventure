import { useState, useEffect } from 'react';
import { Monster } from '../../types';
import { Projectile } from '../types';

export const useProjectiles = (
  currentMonster: Monster | null,
  playerPosition: number,
  playerY: number,
  currentHealth: number,
  onHit: (damage: number) => void
) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  useEffect(() => {
    if (currentMonster && currentHealth > 0) {
      const shootInterval = setInterval(() => {
        const distanceToPlayer = Math.abs(400 - playerPosition);
        if (distanceToPlayer <= 500) {
          const newProjectile: Projectile = {
            id: Date.now(),
            x: 400,
            y: 50,
            direction: playerPosition > 400 ? 1 : -1
          };
          setProjectiles(prev => [...prev, newProjectile]);
        }
      }, 2000);

      return () => clearInterval(shootInterval);
    }
  }, [currentMonster, currentHealth, playerPosition]);

  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 50 && // Увеличили хитбокс с 30 до 50
                          Math.abs(projectile.y - playerY) < 70; // Увеличили хитбокс с 50 до 70
          
          if (hitPlayer && currentMonster) {
            onHit(currentMonster.power);
            return false;
          }
          
          return Math.abs(projectile.x - 400) < 600;
        })
      );
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, onHit, currentMonster]);

  return { projectiles };
};