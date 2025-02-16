
import React from 'react';
import { GameWorld } from './GameWorld';
import { GameControls } from '../../components/GameControls';
import { GameOverlay } from './GameOverlay';
import { DiceRollDisplay } from './DiceRollDisplay';

interface GameContainerProps {
  currentHealth: number;
  maxHealth: number;
  playerPower: number;
  isRolling?: boolean;
  diceRoll?: number;
  monsterDiceRoll?: number;
  isMonsterTurn?: boolean;
  monsters: any[];
  targetedMonster: any;
  onAttack: () => void;
  isAttacking: boolean;
  playerLevel: number;
  playerExperience: number;
  requiredExperience: number;
  armor: number;
  maxArmor: number;
  onSelectTarget: (monster: any) => void;
  balance: number;
  isGameOver?: boolean;
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
  isGameOver = false
}: GameContainerProps) => {
  const hasTarget = targetedMonster !== null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-game-background">
      <GameWorld
        gameRef={null}
        cameraOffset={0}
        playerPosition={100}
        playerY={0}
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
      />

      <GameControls
        onMoveLeft={() => {}}
        onMoveRight={() => {}}
        onJump={() => {}}
        onAttack={onAttack}
        isAttacking={isAttacking}
        hasTarget={hasTarget}
        disabled={isGameOver}
      />

      {isRolling && (
        <DiceRollDisplay
          isRolling={isRolling}
          playerRoll={diceRoll}
          monsterRoll={monsterDiceRoll}
          isMonsterTurn={isMonsterTurn}
        />
      )}

      <GameOverlay isGameOver={isGameOver} />
    </div>
  );
};
