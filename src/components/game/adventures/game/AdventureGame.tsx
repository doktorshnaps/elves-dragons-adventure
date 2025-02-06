import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { useAdventureState } from '../hooks/useAdventureState';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { GameOver } from './GameOver';
import { calculateAttackResult } from '../combat/combatUtils';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  
  const {
    currentHealth,
    setCurrentHealth,
    monsters,
    setMonsters,
    cameraOffset,
    setCameraOffset,
    generateMonster
  } = useAdventureState(playerHealth);

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

  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastMonsterSpawn.current > 2000) { // Спавн каждые 2 секунды
      const spawnDistance = isMovingRight ? playerPosition + 400 : playerPosition - 400;
      
      // Проверяем, нет ли уже монстров в этой области
      const monsterExists = monsters.some(monster => 
        Math.abs(monster.position! - spawnDistance) < 200
      );
      
      if (!monsterExists && ((isMovingRight && spawnDistance > playerPosition) || 
          (isMovingLeft && spawnDistance < playerPosition))) {
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
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster, monsters]);

  const handleMonsterSelect = (monster: Monster) => {
    setSelectedMonster(monster);
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран как цель для атаки`,
    });
  };

  const calculateAttackResult = (baseDamage: number) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    
    switch (roll) {
      case 1:
        return {
          type: 'block',
          damage: 0,
          message: 'Атака заблокирована!'
        };
      case 2:
        return {
          type: 'normal',
          damage: baseDamage,
          message: 'Обычная атака'
        };
      case 3:
        return {
          type: 'critical',
          damage: Math.floor(baseDamage * 1.3),
          message: 'Критический удар!'
        };
      case 4:
        return {
          type: 'counter',
          damage: -baseDamage,
          message: 'Атака парирована!'
        };
      case 5:
        return {
          type: 'weak',
          damage: Math.floor(baseDamage * 0.7),
          message: 'Слабая атака'
        };
      case 6:
        return {
          type: 'fatal',
          damage: baseDamage * 2,
          message: 'Фатальная атака!'
        };
      default:
        return {
          type: 'normal',
          damage: baseDamage,
          message: 'Обычная атака'
        };
    }
  };

  const handleAttack = () => {
    if (!selectedMonster) {
      toast({
        title: "Выберите цель",
        description: "Сначала выберите монстра для атаки",
        variant: "destructive"
      });
      return;
    }

    if (!isPlayerTurn) {
      toast({
        title: "Подождите",
        description: "Сейчас ход противника",
        variant: "destructive"
      });
      return;
    }

    const result = calculateAttackResult(playerPower);
    
    if (result.damage >= 0) {
      // Атака по монстру
      const updatedMonster = {
        ...selectedMonster,
        health: Math.max(0, selectedMonster.health - result.damage)
      };

      toast({
        title: result.message,
        description: `Нанесено ${result.damage} урона`,
        variant: result.type === 'fatal' || result.type === 'critical' ? "destructive" : "default"
      });

      if (updatedMonster.health <= 0) {
        setMonsters(prev => prev.filter(m => m.id !== selectedMonster.id));
        setSelectedMonster(null);
        onMonsterDefeat(updatedMonster);
        setIsPlayerTurn(true);
      } else {
        setMonsters(prev => 
          prev.map(m => m.id === selectedMonster.id ? updatedMonster : m)
        );
        setIsPlayerTurn(false);
        
        // Ход монстра
        setTimeout(() => {
          const monsterResult = calculateAttackResult(updatedMonster.power);
          if (monsterResult.damage >= 0) {
            const newHealth = Math.max(0, currentHealth - monsterResult.damage);
            setCurrentHealth(newHealth);
            
            toast({
              title: `${updatedMonster.name} атакует!`,
              description: `${monsterResult.message} Получено ${monsterResult.damage} урона!`,
              variant: monsterResult.type === 'fatal' || monsterResult.type === 'critical' ? "destructive" : "default"
            });
          } else {
            toast({
              title: monsterResult.message,
              description: "Монстр промахнулся!",
            });
          }
          setIsPlayerTurn(true);
        }, 1000);
      }
    } else {
      // Урон игроку (парирование)
      const playerDamage = Math.abs(result.damage);
      setCurrentHealth(prev => Math.max(0, prev - playerDamage));
      
      toast({
        title: result.message,
        description: `Получено ${playerDamage} урона`,
        variant: "destructive"
      });
      
      setIsPlayerTurn(false);
      setTimeout(() => setIsPlayerTurn(true), 1000);
    }
  };

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
        <div 
          ref={gameContainerRef}
          className="w-full h-full relative overflow-hidden"
        >
          <GameWorld
            gameRef={gameRef}
            cameraOffset={cameraOffset}
            playerPosition={playerPosition}
            playerY={playerY}
            currentHealth={currentHealth}
            playerPower={playerPower}
            monsters={monsters}
            selectedMonsterId={selectedMonster?.id}
            onMonsterSelect={handleMonsterSelect}
          />

          <div className="fixed bottom-20 right-1/2 transform translate-x-1/2 z-50">
            <Button
              onClick={handleAttack}
              disabled={!selectedMonster || currentHealth <= 0}
              className="bg-game-accent hover:bg-game-accent/90"
            >
              Атаковать выбранную цель
            </Button>
          </div>
        </div>

        <GameControls
          onMoveLeft={setIsMovingLeft}
          onMoveRight={setIsMovingRight}
          onJump={handleJump}
          onAttack={handleAttack}
          isAttacking={false}
        />
      </Card>
    </>
  );
};