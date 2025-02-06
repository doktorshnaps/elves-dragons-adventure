import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Monster } from '../types';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useProjectiles } from './hooks/useProjectiles';
import { GameControls } from '../components/GameControls';
import { GameWorld } from '../components/GameWorld';
import { PlayerStatsHeader } from './PlayerStatsHeader';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useDiceRoll } from './hooks/useDiceRoll';
import { useMonsterSpawning } from './hooks/useMonsterSpawning';
import { GameOverlay } from './components/GameOverlay';
import { TargetedMonster } from './types/combatTypes';

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
  playerLevel,
  playerExperience,
  requiredExperience,
  maxHealth
}: AdventureGameProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentHealth, setCurrentHealth] = useState(playerHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [cameraOffset, setCameraOffset] = useState(0);

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

  const { monsters, setMonsters } = useMonsterSpawning(
    playerPosition,
    isMovingRight,
    isMovingLeft
  );

  const { projectiles } = useProjectiles(
    currentMonster,
    playerPosition,
    playerY,
    currentHealth,
    (damage: number) => setCurrentHealth(prev => Math.max(0, prev - damage))
  );

  const handleMonsterDamage = (damage: number) => {
    if (!targetedMonster) return;

    const updatedMonsters = monsters.map(m => {
      if (m.id === targetedMonster.id) {
        const newHealth = Math.max(0, m.health - damage);
        if (newHealth <= 0) {
          onMonsterDefeat(m);
          return null;
        }
        return { ...m, health: newHealth };
      }
      return m;
    }).filter(Boolean) as Monster[];

    setMonsters(updatedMonsters);
    setIsAttacking(false);

    const monster = monsters.find(m => m.id === targetedMonster.id);
    if (monster && updatedMonsters.find(m => m.id === monster.id)) {
      handleMonsterAttack(monster);
    }
  };

  const {
    isRolling,
    diceRoll,
    monsterDiceRoll,
    isMonsterTurn,
    handlePlayerAttack,
    handleMonsterAttack
  } = useDiceRoll((damage: number) => {
    if (isMonsterTurn) {
      setCurrentHealth(prev => Math.max(0, prev - damage));
    } else {
      handleMonsterDamage(damage);
    }
  });

  const handleSelectTarget = (monster: Monster) => {
    if (!monster.position) return;
    setTargetedMonster({
      id: monster.id,
      position: monster.position
    });
  };

  const handleAttack = async () => {
    if (!targetedMonster || isRolling) return;
    setIsAttacking(true);
    const monster = monsters.find(m => m.id === targetedMonster.id);
    if (monster) {
      await handlePlayerAttack(monster, playerPower);
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
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [currentHealth, isGameOver, navigate, toast]);

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
        <GameOverlay
          currentHealth={currentHealth}
          isRolling={isRolling}
          diceRoll={diceRoll}
          monsterDiceRoll={monsterDiceRoll}
          isMonsterTurn={isMonsterTurn}
          monsterName={monsters.find(m => m.id === targetedMonster?.id)?.name}
        />

        <div ref={gameContainerRef} className="w-full h-full relative overflow-hidden">
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