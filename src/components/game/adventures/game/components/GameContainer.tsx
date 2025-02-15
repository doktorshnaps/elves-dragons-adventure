import React, { useRef, useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { GameOverlay } from './GameOverlay';
import { GameWorldContainer } from './GameWorldContainer';
import { GameControls } from '../../components/GameControls';
import { Monster } from '../../types';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { TargetedMonster } from '../types/combatTypes';
import { Obstacle } from '../ObstacleSprite';
import { useToast } from '@/hooks/use-toast';

interface GameContainerProps {
  currentHealth: number;
  maxHealth: number;
  playerPower: number;
  isRolling: boolean;
  diceRoll: number | null;
  monsterDiceRoll: number | null;
  isMonsterTurn: boolean;
  monsters: Monster[];
  targetedMonster: TargetedMonster | null;
  onAttack: () => void;
  isAttacking: boolean;
  playerLevel: number;
  playerExperience: number;
  requiredExperience: number;
  armor: number;
  maxArmor: number;
  onSelectTarget: (monster: Monster) => void;
  balance: number;
  onTakeDamage?: (damage: number) => void;
  isMovingRight: boolean;
  isMovingLeft: boolean;
  setIsMovingRight: (value: boolean) => void;
  setIsMovingLeft: (value: boolean) => void;
  playerPosition: number;
}

export const GameContainer = ({
  currentHealth,
  maxHealth,
  playerPower,
  isRolling,
  diceRoll,
  monsterDiceRoll,
  isMonsterTurn,
  monsters,
  targetedMonster,
  onAttack,
  isAttacking,
  playerLevel,
  playerExperience,
  requiredExperience,
  armor,
  maxArmor,
  onSelectTarget,
  balance,
  onTakeDamage,
  isMovingRight,
  isMovingLeft,
  setIsMovingRight,
  setIsMovingLeft,
  playerPosition
}: GameContainerProps) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [isRespawning, setIsRespawning] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const {
    playerY,
    handleJump,
    cameraOffset,
    resetPosition
  } = usePlayerMovement((pos: number) => {
    if (gameContainerRef.current) {
      const containerWidth = gameContainerRef.current.offsetWidth;
      const offset = Math.max(0, pos - containerWidth / 3);
      return offset;
    }
    return 0;
  });

  useEffect(() => {
    if (currentHealth <= 0 && !isRespawning) {
      setIsRespawning(true);
      toast({
        title: "Герой пал в бою",
        description: "Возрождение через 3 секунды...",
        duration: 2000
      });

      setTimeout(() => {
        // Возвращаем игрока на стартовую позицию
        resetPosition();
        setIsRespawning(false);
        
        // Вызываем событие возрождения
        const event = new CustomEvent('playerRespawn', {
          detail: { maxHealth }
        });
        window.dispatchEvent(event);
      }, 3000);
    }
  }, [currentHealth, maxHealth, isRespawning, toast]);

  // Generate obstacles
  useEffect(() => {
    const generateObstacles = () => {
      const newObstacles: Obstacle[] = [];
      let position = 600; // Start after initial position

      for (let i = 0; i < 10; i++) {
        const type = Math.random() > 0.5 ? 'spike' : 'pit';
        newObstacles.push({
          id: Math.random(),
          position: position,
          type,
          damage: type === 'spike' ? 20 : 10
        });
        position += Math.random() * (400 - 200) + 200;
      }

      setObstacles(newObstacles);
    };

    generateObstacles();
  }, []);

  const handleObstacleCollision = (damage: number) => {
    if (onTakeDamage) {
      onTakeDamage(damage);
    }
  };

  return (
    <Card className="w-full h-[500px] relative overflow-hidden bg-game-background mt-4">
      <GameOverlay
        currentHealth={currentHealth}
        isRolling={isRolling}
        diceRoll={diceRoll}
        monsterDiceRoll={monsterDiceRoll}
        isMonsterTurn={isMonsterTurn}
        monsterName={monsters.find(m => m.id === targetedMonster?.id)?.name}
        isRespawning={isRespawning}
      />

      <div ref={gameContainerRef} className="w-full h-full relative">
        <GameWorldContainer
          gameRef={gameRef}
          cameraOffset={cameraOffset}
          playerPosition={playerPosition}
          playerY={playerY}
          isAttacking={isAttacking}
          currentHealth={currentHealth}
          playerPower={playerPower}
          monsters={monsters}
          projectiles={[]}
          onSelectTarget={onSelectTarget}
          targetedMonster={targetedMonster}
          armor={armor}
          maxArmor={maxArmor}
          maxHealth={maxHealth}
          level={playerLevel}
          experience={playerExperience}
          requiredExperience={requiredExperience}
          balance={balance}
          obstacles={obstacles}
          onObstacleCollision={handleObstacleCollision}
          isRespawning={isRespawning}
        />
      </div>

      <GameControls
        onMoveLeft={setIsMovingLeft}
        onMoveRight={setIsMovingRight}
        onJump={handleJump}
        onAttack={onAttack}
        isAttacking={isAttacking}
        hasTarget={!!targetedMonster}
        disabled={currentHealth <= 0 && !isRespawning}
      />
    </Card>
  );
};
