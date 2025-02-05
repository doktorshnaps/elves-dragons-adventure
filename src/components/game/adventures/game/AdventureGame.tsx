import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { PlayerCharacter } from './PlayerCharacter';
import { MonsterSprite } from './MonsterSprite';

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
  const [playerPosition, setPlayerPosition] = useState(100);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIsMovingRight(true);
      if (e.key === 'ArrowLeft') setIsMovingLeft(true);
      if (e.key === ' ') handleAttack();
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
        setPlayerPosition(prev => Math.min(prev + 5, 700));
      }
      if (isMovingLeft) {
        setPlayerPosition(prev => Math.max(prev - 5, 0));
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

  const handleAttack = () => {
    if (isAttacking || !currentMonster) return;
    
    setIsAttacking(true);
    setTimeout(() => {
      setIsAttacking(false);
      if (currentMonster && 
          Math.abs(playerPosition - 400) < 100) { // Check if player is close enough to monster
        onMonsterDefeat(currentMonster);
      }
    }, 500);
  };

  return (
    <Card className="w-full h-[300px] relative overflow-hidden bg-game-background border-game-accent">
      <div 
        ref={gameRef}
        className="w-full h-full relative"
        style={{
          backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-[50px] bg-game-surface/50" />

        {/* Player */}
        <PlayerCharacter
          position={playerPosition}
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
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-4 left-4 flex gap-4 md:hidden">
        <button
          className="w-12 h-12 bg-game-primary/50 rounded-full"
          onTouchStart={() => setIsMovingLeft(true)}
          onTouchEnd={() => setIsMovingLeft(false)}
        >
          ←
        </button>
        <button
          className="w-12 h-12 bg-game-primary/50 rounded-full"
          onTouchStart={() => setIsMovingRight(true)}
          onTouchEnd={() => setIsMovingRight(false)}
        >
          →
        </button>
        <button
          className="w-12 h-12 bg-game-accent/50 rounded-full"
          onClick={handleAttack}
        >
          ⚔️
        </button>
      </div>
    </Card>
  );
};