import { GameOver } from '../GameOver';
import { DiceRollDisplay } from './DiceRollDisplay';

interface GameOverlayProps {
  currentHealth: number;
  isRolling: boolean;
  diceRoll: number | null;
  monsterDiceRoll: number | null;
  isMonsterTurn: boolean;
  monsterName?: string;
}

export const GameOverlay = ({
  currentHealth,
  isRolling,
  diceRoll,
  monsterDiceRoll,
  isMonsterTurn,
  monsterName
}: GameOverlayProps) => {
  return (
    <>
      {currentHealth <= 0 && <GameOver />}
      <DiceRollDisplay
        isRolling={isRolling}
        diceRoll={diceRoll}
        monsterDiceRoll={monsterDiceRoll}
        isMonsterTurn={isMonsterTurn}
        monsterName={monsterName}
      />
    </>
  );
};