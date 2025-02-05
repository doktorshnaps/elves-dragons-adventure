import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { PlayerCharacter } from './PlayerCharacter';
import { MonsterSprite } from './MonsterSprite';
import { ProjectileSprite } from './ProjectileSprite';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { useMonsterGeneration } from '../useMonsterGeneration';

interface AdventureGameProps {
  onMonsterDefeat: (monster: Monster) => void;
  playerHealth: number;
  playerPower: number;
  currentMonster: Monster | null;
}

export const AdventureGame = ({ 
  onMonsterDefeat, 
  playerHealth,
  playerPower,
  currentMonster 
}: AdventureGameProps) => {
  const [currentHealth, setCurrentHealth] = useState(playerHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastMonsterSpawn = useRef(0);
  const { generateMonster } = useMonsterGeneration(1);

  const updateCameraOffset = (playerPos: number) => {
    if (!gameContainerRef.current) return;
    const containerWidth = gameContainerRef.current.offsetWidth;
    const centerPoint = containerWidth / 2;
    setCameraOffset(Math.max(0, playerPos - centerPoint));
  };

  const {
    playerPosition,
    playerY,
    isMovingRight,
    isMovingLeft,
    handleJump,
    setIsMovingRight,
    setIsMovingLeft
  } = usePlayerMovement(updateCameraOffset);

  const handleProjectileHit = (damage: number) => {
    setCurrentHealth(prev => Math.max(0, prev - damage));
  };

  const { projectiles } = useProjectiles(
    currentMonster,
    playerPosition,
    playerY,
    currentHealth,
    handleProjectileHit
  );

  // Генерация монстров при движении
  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastMonsterSpawn.current > 2000 && (isMovingRight || isMovingLeft)) {
      const spawnDistance = isMovingRight ? playerPosition + 400 : playerPosition - 400;
      const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1; // Увеличиваем уровень каждые 1000 пикселей
      const newMonster = generateMonster(spawnDistance);
      
      // Усиливаем монстра в зависимости от расстояния
      newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
      newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
      newMonster.maxHealth = newMonster.health;
      
      setMonsters(prev => [...prev, newMonster]);
      lastMonsterSpawn.current = currentTime;
    }
  }, [playerPosition, isMovingRight, isMovingLeft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIsMovingRight(true);
      if (e.key === 'ArrowLeft') setIsMovingLeft(true);
      if (e.key === ' ') handleAttack();
      if (e.key === 'ArrowUp') handleJump();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIsMovingRight(false);
      if (e.key === 'ArrowLeft') setIsMovingLeft(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleAttack = () => {
    if (isAttacking || !currentMonster) return;
    
    setIsAttacking(true);
    setTimeout(() => {
      setIsAttacking(false);
      if (currentMonster && Math.abs(playerPosition - 400) < 100) {
        const damage = Math.max(1, playerPower + Math.floor(Math.random() * 3));
        const updatedMonster = {
          ...currentMonster,
          health: Math.max(0, currentMonster.health - damage)
        };
        onMonsterDefeat(updatedMonster);
      }
    }, 500);
  };

  // Очистка монстров, которые далеко от игрока
  useEffect(() => {
    setMonsters(prev => prev.filter(monster => 
      Math.abs(monster.position! - playerPosition) < 800
    ));
  }, [playerPosition]);

  const [cameraOffset, setCameraOffset] = useState(0);

  return (
    <Card className="w-full h-[300px] relative overflow-hidden bg-game-background">
      <div 
        ref={gameContainerRef}
        className="w-full h-full relative overflow-hidden"
      >
        <div 
          ref={gameRef}
          className="absolute h-full"
          style={{
            width: '100000px', // Очень большая ширина для "бесконечной" карты
            backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat-x',
            transform: `translateX(-${cameraOffset}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="absolute bottom-0 w-full h-[50px] bg-game-surface/50" />

          <PlayerCharacter
            position={playerPosition}
            yPosition={playerY}
            isAttacking={isAttacking}
            health={currentHealth}
            power={playerPower}
          />

          {monsters.map(monster => (
            <MonsterSprite
              key={monster.id}
              monster={monster}
              position={monster.position || 400}
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

        <div className="fixed bottom-20 left-4 flex gap-4 md:hidden z-50">
          <button
            className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm"
            onTouchStart={() => setIsMovingLeft(true)}
            onTouchEnd={() => setIsMovingLeft(false)}
          >
            ←
          </button>
          <button
            className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm"
            onTouchStart={() => setIsMovingRight(true)}
            onTouchEnd={() => setIsMovingRight(false)}
          >
            →
          </button>
        </div>
        
        <button
          className="fixed bottom-20 right-28 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm md:hidden z-50"
          onClick={handleJump}
        >
          ↑
        </button>

        <button
          className="fixed bottom-20 right-8 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm md:hidden z-50"
          onClick={handleAttack}
          disabled={isAttacking}
        >
          ⚔️
        </button>
      </div>
    </Card>
  );
};