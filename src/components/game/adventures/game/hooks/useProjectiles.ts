import { useState, useEffect } from 'react';
import { Monster } from '../../types';
import { Projectile } from '../types';

export const useProjectiles = (
  currentMonster: Monster | null,
  playerPosition: number,
  playerY: number,
  currentHealth: number,
  onHit: (damage: number) => void,
  monsters: Monster[]
) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  useEffect(() => {
    if (currentHealth <= 0) return;

    const intervals = monsters.map(monster => {
      return setInterval(() => {
        if (monster.health > 0) {
          setProjectiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            x: monster.position || 0,
            y: 50,
            direction: playerPosition > (monster.position || 0) ? 1 : -1,
            monsterId: monster.id
          }]);
        }
      }, 2000);
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [monsters, currentHealth, playerPosition]);

  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 30 &&
                          Math.abs(projectile.y - playerY) < 50;
          
          const sourceMonster = monsters.find(m => m.id === projectile.monsterId);
          
          if (hitPlayer && sourceMonster) {
            const damage = Math.max(5, Math.floor(sourceMonster.power * 0.5));
            onHit(damage);
            return false;
          }
          
          return Math.abs(projectile.x - playerPosition) < 1200;
        })
      );
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, onHit, monsters]);

  return { projectiles };
};