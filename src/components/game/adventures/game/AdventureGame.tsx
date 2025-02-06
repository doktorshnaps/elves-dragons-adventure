import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { useAdventureState } from '../hooks/useAdventureState';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { MagicProjectile } from './MagicProjectile';
import { GameOver } from './GameOver';
import { v4 as uuidv4 } from 'uuid';
import { TargetedMonster } from './types/combatTypes';
import { useCombatSystem } from './hooks/useCombatSystem';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AdventureGameProps {
  onMonsterDefeat: (monster: Monster) => void;
  playerHealth: number;
  playerPower: number;
  currentMonster: Monster | null;
  playerLevel: number;
  playerExperience: number;
  requiredExperience: number;
  maxHealth: number;
}

export const AdventureGame = ({ 
  onMonsterDefeat, 
  playerHealth,
  playerPower,
  currentMonster,
  playerLevel,
  playerExperience,
  requiredExperience,
  maxHealth
}: AdventureGameProps) => {
  const { toast } = useToast();
  const {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    monsters,
    setMonsters,
    cameraOffset,
    setCameraOffset,
    generateMonster
  } = useAdventureState(playerHealth);

  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMonsterTurn, setIsMonsterTurn] = useState(false);
  const [monsterDiceRoll, setMonsterDiceRoll] = useState<number | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastMonsterSpawn = useRef(0);

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

  const rollDice = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const handleMonsterAttack = async (monster: Monster) => {
    setIsMonsterTurn(true);
    setIsRolling(true);

    // Анимация броска кубика монстра
    let currentRoll = 1;
    const finalRoll = rollDice();
    
    // Анимация прокрутки чисел
    const interval = setInterval(() => {
      setMonsterDiceRoll(Math.floor(Math.random() * 20) + 1);
    }, 50);

    // Остановка анимации через 1 секунду
    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(interval);
    
    setMonsterDiceRoll(finalRoll);

    // Задержка для отображения финального результата
    await new Promise(resolve => setTimeout(resolve, 500));

    let damageMultiplier = 1;
    if (finalRoll === 20) {
      damageMultiplier = 2;
      toast({
        title: "Критический удар монстра!",
        description: `${monster.name} выбросил ${finalRoll}! Двойной урон!`,
        variant: "destructive"
      });
    } else if (finalRoll === 1) {
      damageMultiplier = 0;
      toast({
        title: "Монстр промахнулся!",
        description: `${monster.name} выбросил 1 и промахнулся!`,
      });
    } else {
      toast({
        title: "Атака монстра!",
        description: `${monster.name} выбросил ${finalRoll}!`,
      });
    }

    const damage = Math.floor(monster.power * damageMultiplier);
    setCurrentHealth(prev => Math.max(0, prev - damage));

    setIsMonsterTurn(false);
    setIsRolling(false);
    setMonsterDiceRoll(null);
  };

  const handleAttack = async () => {
    if (!targetedMonster || isRolling) return;
    
    setIsRolling(true);
    setIsAttacking(true);

    // Анимация прокрутки чисел для броска игрока
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 20) + 1);
    }, 50);

    // Остановка анимации через 1 секунду
    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(interval);

    const finalRoll = rollDice();
    setDiceRoll(finalRoll);

    // Задержка для отображения финального результата
    await new Promise(resolve => setTimeout(resolve, 500));

    const monster = monsters.find(m => m.id === targetedMonster.id);
    if (!monster) {
      setIsRolling(false);
      setIsAttacking(false);
      return;
    }

    let damageMultiplier = 1;
    if (finalRoll === 20) {
      damageMultiplier = 2;
      toast({
        title: "Критический удар!",
        description: `Выпало ${finalRoll}! Двойной урон!`,
        variant: "destructive"
      });
    } else if (finalRoll === 1) {
      damageMultiplier = 0;
      toast({
        title: "Промах!",
        description: "Выпало 1! Атака не попала по цели.",
      });
    } else {
      toast({
        title: "Атака!",
        description: `Выпало ${finalRoll}!`,
      });
    }

    const damage = Math.floor(playerPower * damageMultiplier);
    const updatedMonsters = monsters.map(m => {
      if (m.id === monster.id) {
        const newHealth = Math.max(0, m.health - damage);
        if (newHealth <= 0) {
          onMonsterDefeat(m);
          return null;
        }
        return {
          ...m,
          health: newHealth
        };
      }
      return m;
    }).filter(Boolean) as Monster[];

    setMonsters(updatedMonsters);
    setIsRolling(false);
    setIsAttacking(false);
    setDiceRoll(null);

    // Если монстр выжил, он контратакует
    if (updatedMonsters.find(m => m.id === monster.id)) {
      await handleMonsterAttack(monster);
    }
  };

  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastMonsterSpawn.current > 2000) {
      const spawnDistance = isMovingRight ? playerPosition + 400 : playerPosition - 400;
      
      if ((isMovingRight && spawnDistance > playerPosition) || 
          (isMovingLeft && spawnDistance < playerPosition)) {
        const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
        const newMonster = generateMonster(spawnDistance);
        
        if (newMonster) {
          newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
          newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
          newMonster.maxHealth = newMonster.health;
          
          setMonsters(prev => [...prev, newMonster]);
          lastMonsterSpawn.current = currentTime;
        }
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster]);

  return (
    <>
      <PlayerStatsHeader
        health={currentHealth}
        maxHealth={maxHealth}
        power={playerPower}
        level={playerLevel}
        experience={playerExperience}
        requiredExperience={requiredExperience}
      />
      
      <Card className="w-full h-[500px] relative overflow-hidden bg-game-background mt-4">
        {currentHealth <= 0 && <GameOver />}
        
        {/* Анимация броска кубика */}
        <AnimatePresence>
          {isRolling && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-game-accent rounded-lg p-8 text-4xl font-bold"
            >
              {isMonsterTurn ? (
                <div className="text-center">
                  <div className="text-sm mb-2">Бросок монстра</div>
                  {monsterDiceRoll}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm mb-2">Ваш бросок</div>
                  {diceRoll}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={gameContainerRef}
          className="w-full h-full relative overflow-hidden"
        >
          <GameWorld
            gameRef={gameRef}
            cameraOffset={cameraOffset}
            playerPosition={playerPosition}
            playerY={playerY}
            isAttacking={isAttacking}
            currentHealth={currentHealth}
            playerPower={playerPower}
            monsters={monsters}
            projectiles={projectiles}
            onSelectTarget={setTargetedMonster}
            targetedMonster={targetedMonster}
          />
        </div>

        <GameControls
          onMoveLeft={setIsMovingLeft}
          onMoveRight={setIsMovingRight}
          onJump={handleJump}
          onAttack={handleAttack}
          isAttacking={isAttacking}
          hasTarget={!!targetedMonster}
        />
      </Card>
    </>
  );
};
