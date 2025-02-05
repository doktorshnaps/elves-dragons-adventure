import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { PlayerCharacter } from './PlayerCharacter';
import { MonsterSprite } from './MonsterSprite';
import { ProjectileSprite } from './ProjectileSprite';

interface AdventureGameProps {
  onMonsterDefeat: (monster: Monster) => void;
  playerHealth: number;
  playerPower: number;
  currentMonster: Monster | null;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  direction: number;
}

export const AdventureGame = ({ 
  onMonsterDefeat, 
  playerHealth,
  playerPower,
  currentMonster 
}: AdventureGameProps) => {
  const [playerPosition, setPlayerPosition] = useState(100);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [cameraOffset, setCameraOffset] = useState(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const jumpTimeout = useRef<NodeJS.Timeout | null>(null);
  const projectileInterval = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    let animationFrame: number;
    
    const updatePosition = () => {
      if (isMovingRight) {
        setPlayerPosition(prev => {
          const newPosition = Math.min(prev + 5, 2000);
          updateCameraOffset(newPosition);
          return newPosition;
        });
      }
      if (isMovingLeft) {
        setPlayerPosition(prev => {
          const newPosition = Math.max(prev - 5, 0);
          updateCameraOffset(newPosition);
          return newPosition;
        });
      }
      animationFrame = requestAnimationFrame(updatePosition);
    };

    if (isMovingRight || isMovingLeft) {
      animationFrame = requestAnimationFrame(updatePosition);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isMovingRight, isMovingLeft]);

  // Эффект для обработки прыжка
  useEffect(() => {
    if (isJumping) {
      const gravity = 0.5;
      let velocity = 12;
      
      const jumpAnimation = () => {
        setPlayerY(prev => {
          const newY = prev + velocity;
          velocity -= gravity;
          
          if (newY <= 0) {
            setIsJumping(false);
            return 0;
          }
          
          return newY;
        });
        
        if (isJumping) {
          requestAnimationFrame(jumpAnimation);
        }
      };
      
      requestAnimationFrame(jumpAnimation);
    }
  }, [isJumping]);

  // Эффект для стрельбы монстра
  useEffect(() => {
    if (currentMonster && playerHealth > 0) {
      projectileInterval.current = setInterval(() => {
        const newProjectile: Projectile = {
          id: Date.now(),
          x: 400, // позиция монстра
          y: 50,
          direction: playerPosition > 400 ? 1 : -1
        };
        setProjectiles(prev => [...prev, newProjectile]);
      }, 2000);
    }

    return () => {
      if (projectileInterval.current) {
        clearInterval(projectileInterval.current);
      }
    };
  }, [currentMonster, playerHealth, playerPosition]);

  // Эффект для движения снарядов
  useEffect(() => {
    const moveProjectiles = () => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + (projectile.direction * 5)
        })).filter(projectile => {
          const hitPlayer = Math.abs(projectile.x - playerPosition) < 30 && 
                          Math.abs(projectile.y - playerY) < 50;
          
          if (hitPlayer) {
            onMonsterDefeat(currentMonster!);
          }
          
          return !hitPlayer && projectile.x > 0 && projectile.x < 2000;
        })
      );
      requestAnimationFrame(moveProjectiles);
    };

    const animation = requestAnimationFrame(moveProjectiles);
    return () => cancelAnimationFrame(animation);
  }, [playerPosition, playerY, currentMonster, onMonsterDefeat]);

  const updateCameraOffset = (playerPos: number) => {
    if (!gameContainerRef.current) return;
    
    const containerWidth = gameContainerRef.current.offsetWidth;
    const centerPoint = containerWidth / 2;
    
    setCameraOffset(Math.max(0, playerPos - centerPoint));
  };

  const handleJump = () => {
    if (!isJumping) {
      setIsJumping(true);
    }
  };

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

  return (
    <Card className="w-full h-[300px] relative overflow-hidden bg-game-background border-game-accent">
      <div 
        ref={gameContainerRef}
        className="w-full h-full relative overflow-hidden"
      >
        <div 
          ref={gameRef}
          className="w-[3000px] h-full relative"
          style={{
            backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateX(-${cameraOffset}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-[50px] bg-game-surface/50" />

          {/* Player */}
          <PlayerCharacter
            position={playerPosition}
            yPosition={playerY}
            isAttacking={isAttacking}
            health={playerHealth}
            power={playerPower}
          />

          {/* Monster */}
          {currentMonster && (
            <MonsterSprite
              monster={currentMonster}
              position={400}
            />
          )}

          {/* Projectiles */}
          {projectiles.map(projectile => (
            <ProjectileSprite
              key={projectile.id}
              x={projectile.x}
              y={projectile.y}
            />
          ))}
        </div>

        {/* Mobile Controls */}
        <div className="fixed bottom-20 left-4 flex gap-4 md:hidden z-50">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm border-2 border-game-accent"
            onTouchStart={() => setIsMovingLeft(true)}
            onTouchEnd={() => setIsMovingLeft(false)}
          >
            ←
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-game-primary/80 rounded-full flex items-center justify-center text-white text-2xl shadow-lg backdrop-blur-sm border-2 border-game-accent"
            onTouchStart={() => setIsMovingRight(true)}
            onTouchEnd={() => setIsMovingRight(false)}
          >
            →
          </motion.button>
        </div>
        
        {/* Jump Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-28 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm border-2 border-game-accent md:hidden z-50"
          onClick={handleJump}
        >
          ↑
        </motion.button>

        {/* Attack Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-8 w-20 h-20 bg-game-accent/80 rounded-full flex items-center justify-center text-white text-3xl shadow-lg backdrop-blur-sm border-2 border-game-accent md:hidden z-50"
          onClick={handleAttack}
          disabled={isAttacking}
        >
          ⚔️
        </motion.button>
      </div>
    </Card>
  );
};