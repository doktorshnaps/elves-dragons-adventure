
import { motion, AnimatePresence } from 'framer-motion';

interface DiceRollDisplayProps {
  isRolling?: boolean;
  playerRoll?: number | null;
  monsterRoll?: number | null;
  isMonsterTurn?: boolean;
  monsterName?: string;
}

export const DiceRollDisplay = ({
  isRolling,
  playerRoll,
  monsterRoll,
  isMonsterTurn,
  monsterName
}: DiceRollDisplayProps) => {
  return (
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
              <div className="text-sm mb-2">Бросок {monsterName || 'монстра'}</div>
              {monsterRoll}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm mb-2">Ваш бросок</div>
              {playerRoll}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
