import { useState, useEffect, useRef, useCallback } from 'react';
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
  const projectilesRef = useRef<Projectile[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Stable refs for values used in animation loop
  const playerPositionRef = useRef(playerPosition);
  const playerYRef = useRef(playerY);
  const onHitRef = useRef(onHit);
  const monstersRef = useRef(monsters);

  playerPositionRef.current = playerPosition;
  playerYRef.current = playerY;
  onHitRef.current = onHit;
  monstersRef.current = monsters;

  // Spawn projectiles on interval
  useEffect(() => {
    if (currentHealth <= 0) return;

    const intervals = monsters.map(monster => {
      return setInterval(() => {
        if (monster.health > 0) {
          const newProjectile: Projectile = {
            id: Date.now() + Math.random(),
            x: monster.position || 0,
            y: 50,
            direction: playerPositionRef.current > (monster.position || 0) ? 1 : -1,
            monsterId: monster.id
          };
          projectilesRef.current = [...projectilesRef.current, newProjectile];
        }
      }, 2000);
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [monsters, currentHealth]);

  // Stable animation loop using useRef
  const animate = useCallback(() => {
    const now = Date.now();
    const pos = playerPositionRef.current;
    const pY = playerYRef.current;

    projectilesRef.current = projectilesRef.current
      .map(p => ({ ...p, x: p.x + p.direction * 5 }))
      .filter(p => {
        const hitPlayer = Math.abs(p.x - pos) < 30 && Math.abs(p.y - pY) < 50;
        const sourceMonster = monstersRef.current.find(m => m.id === p.monsterId);

        if (hitPlayer && sourceMonster) {
          const damage = Math.max(5, Math.floor(sourceMonster.power * 0.5));
          onHitRef.current(damage);
          return false;
        }

        return Math.abs(p.x - pos) < 1200;
      });

    // Sync to React state at throttled rate (~100ms) to avoid excessive re-renders
    if (now - lastSyncRef.current > 100) {
      lastSyncRef.current = now;
      setProjectiles([...projectilesRef.current]);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return { projectiles };
};
