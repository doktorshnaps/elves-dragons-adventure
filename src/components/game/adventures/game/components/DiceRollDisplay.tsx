
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DiceRollDisplayProps {
  isRolling: boolean;
  diceRoll: number | null;
  monsterDiceRoll: number | null;
  isMonsterTurn: boolean;
  monsterName?: string;
}

type AttackDescriptions = {
  [key: number]: string;
};

const attackDescriptions: AttackDescriptions = {
  1: "Промах",
  2: "Слабый удар (50%)",
  3: "Обычный удар (100%)",
  4: "Обычный удар (100%)",
  5: "Сильный удар (150%)",
  6: "Критический удар (200%)"
};

export const DiceRollDisplay = ({
  isRolling,
  diceRoll,
  monsterDiceRoll,
  isMonsterTurn,
  monsterName
}: DiceRollDisplayProps) => {
  const [currentRoll, setCurrentRoll] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setIsSpinning(true);
      const interval = setInterval(() => {
        setCurrentRoll(prev => (prev % 6) + 1);
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setIsSpinning(false);
      }, 2000);
    }
  }, [isRolling]);

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
              <motion.div
                key={isSpinning ? currentRoll : monsterDiceRoll}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: isSpinning ? 1 : 1.2
                }}
                transition={{ 
                  duration: isSpinning ? 0.2 : 0.5,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {isSpinning ? (
                  <div className="space-y-1">
                    <div>{currentRoll}</div>
                    <div className="text-sm">{attackDescriptions[currentRoll]}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity
                      }}
                    >
                      {monsterDiceRoll && (
                        <>
                          <div>{monsterDiceRoll}</div>
                          <div className="text-sm">
                            {attackDescriptions[monsterDiceRoll]}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm mb-2">Ваш бросок</div>
              <motion.div
                key={isSpinning ? currentRoll : diceRoll}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: isSpinning ? 1 : 1.2
                }}
                transition={{ 
                  duration: isSpinning ? 0.2 : 0.5,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {isSpinning ? (
                  <div className="space-y-1">
                    <div>{currentRoll}</div>
                    <div className="text-sm">{attackDescriptions[currentRoll]}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity
                      }}
                    >
                      {diceRoll && (
                        <>
                          <div>{diceRoll}</div>
                          <div className="text-sm">
                            {attackDescriptions[diceRoll]}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

