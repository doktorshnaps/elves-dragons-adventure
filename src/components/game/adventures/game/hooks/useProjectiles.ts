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
    if (currentHealth > 0 && currentMonster) {
      const shootInterval = setInterval(() => {
        const newProjectile: Projectile = {
          id: Date.now(),
          x: currentMonster.position, // Используем позицию монстра
          y: 50,
          direction: playerPosition > currentMonster.position ? 1 : -1 // Направление зависит от позиции игрока относительно монстра
        };
        setProjectiles(prev => [...prev, newProjectile]);
      }, 2000);

      return () => clearInterval(shootInterval);
    }
  }, [currentHealth, playerPosition, currentMonster]);

  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 50 &&
                          Math.abs(projectile.y - playerY) < 70;
          
          if (hitPlayer && currentMonster) {
            const damage = Math.max(5, Math.floor(currentMonster.power * 0.5));
            onHit(damage);
            return false;
          }
          
          return Math.abs(projectile.x - (currentMonster?.position || 0)) < 600;
        })
      );
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, onHit, currentMonster]);

  return { projectiles };
};