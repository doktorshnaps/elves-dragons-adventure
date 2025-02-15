
import { GameOver } from '../GameOver';
import { DiceRollDisplay } from './DiceRollDisplay';
import { motion } from 'framer-motion';

interface GameOverlayProps {
  currentHealth: number;
  isRolling: boolean;
  diceRoll: number | null;
  monsterDiceRoll: number | null;
  isMonsterTurn: boolean;
  monsterName?: string;
  isRespawning?: boolean;
}

export const GameOverlay = ({
  currentHealth,
  isRolling,
  diceRoll,
  monsterDiceRoll,
  isMonsterTurn,
  monsterName,
  isRespawning
}: GameOverlayProps) => {
  return (
    <>
      {currentHealth <= 0 && !isRespawning && <GameOver />}
      {isRespawning && (
        <motion.div 
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Возрождение...</h2>
            <p className="text-white/80">Подготовка к новому приключению</p>
          </motion.div>
        </motion.div>
      )}
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
