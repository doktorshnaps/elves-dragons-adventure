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
    if (currentHealth > 0) {
      const shootInterval = setInterval(() => {
        const newProjectile: Projectile = {
          id: Date.now(),
          x: 400,
          y: 50,
          direction: playerPosition > 400 ? 1 : -1
        };
        setProjectiles(prev => [...prev, newProjectile]);
      }, 2000);

      return () => clearInterval(shootInterval);
    }
  }, [currentHealth, playerPosition]);

  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 50 &&
                          Math.abs(projectile.y - playerY) < 70;
          
          if (hitPlayer) {
            // Используем фиксированный урон, если currentMonster не определен
            const damage = 10;
            onHit(damage);
            return false;
          }
          
          return Math.abs(projectile.x - 400) < 600;
        })
      );
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, onHit]);

  return { projectiles };
};