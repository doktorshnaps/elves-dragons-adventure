import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { useAdventureState } from '../hooks/useAdventureState';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { GameOver } from './GameOver';
import { TargetedMonster } from './types/combatTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [currentHealth, setCurrentHealth] = useState(playerHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMonsterTurn, setIsMonsterTurn] = useState(false);
  const [monsterDiceRoll, setMonsterDiceRoll] = useState<number | null>(null);
  const [lastGeneratedPosition, setLastGeneratedPosition] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

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

  const { projectiles } = useProjectiles(
    currentMonster,
    playerPosition,
    playerY,
    currentHealth,
    (damage: number) => setCurrentHealth(prev => Math.max(0, prev - damage))
  );

  const rollDice = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const handleSelectTarget = (monster: Monster) => {
    if (!monster.position) return;
    
    setTargetedMonster({
      id: monster.id,
      position: monster.position
    });
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
    if (currentHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
      toast({
        title: "Игра окончена",
        description: "Ваш герой пал в бою",
        variant: "destructive"
      });
      
      // Задержка перед возвратом в меню
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [currentHealth, isGameOver, navigate, toast]);

  useEffect(() => {
    // Check if we need to generate a new monster based on player position
    const distanceFromLast = Math.abs(playerPosition - lastGeneratedPosition);
    
    if (distanceFromLast >= 200) { // Generate monster every 200 pixels
      const spawnPosition = isMovingRight ? 
        playerPosition + 400 : // Spawn ahead if moving right
        playerPosition - 400;  // Spawn behind if moving left
      
      const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
      const newMonster = generateMonster(spawnPosition);
      
      if (newMonster) {
        newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
        newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
        newMonster.maxHealth = newMonster.health;
        
        setMonsters(prev => [...prev, newMonster]);
        setLastGeneratedPosition(playerPosition);
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster, lastGeneratedPosition]);

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
            onSelectTarget={handleSelectTarget}
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
          disabled={currentHealth <= 0 || isGameOver}
        />
      </Card>
    </>
  );
};
