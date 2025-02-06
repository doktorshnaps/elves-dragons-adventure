import { useState, useEffect } from 'react';
import { Monster } from '../../types';
import { Projectile } from '../types';

export const useProjectiles = (
  currentMonster: Monster | null,
  playerPosition: number,
  playerY: number,
  currentHealth: number,
  onHit: (damage: number) => void,
  monsters: Monster[]  // Добавляем массив всех монстров
) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  useEffect(() => {
    if (currentHealth <= 0 || monsters.length === 0) return;

    // Создаем интервал для каждого монстра
    const intervals = monsters.map(monster => {
      return setInterval(() => {
        if (!monster.position) return;

        const newProjectile: Projectile = {
          id: Date.now() + Math.random(), // Уникальный ID для каждого снаряда
          x: monster.position,
          y: 50,
          direction: playerPosition > monster.position ? 1 : -1,
          monsterId: monster.id // Сохраняем ID монстра, который выпустил снаряд
        };
        setProjectiles(prev => [...prev, newProjectile]);
      }, 2000);
    });

    return () => {
      // Очищаем все интервалы при размонтировании
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [currentHealth, playerPosition, monsters]);

  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 50 &&
                          Math.abs(projectile.y - playerY) < 70;
          
          // Находим монстра, который выпустил этот снаряд
          const sourceMonster = monsters.find(m => m.id === projectile.monsterId);
          
          if (hitPlayer && sourceMonster) {
            const damage = Math.max(5, Math.floor(sourceMonster.power * 0.5));
            onHit(damage);
            return false;
          }
          
          // Удаляем снаряд, если он улетел слишком далеко от своего монстра
          const sourceMonsterPosition = sourceMonster?.position || 0;
          return Math.abs(projectile.x - sourceMonsterPosition) < 600;
        })
      );
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, onHit, monsters]);

  return { projectiles };
};