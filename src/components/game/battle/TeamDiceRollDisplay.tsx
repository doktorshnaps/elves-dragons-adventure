import { motion, AnimatePresence } from 'framer-motion';

interface TeamDiceRollDisplayProps {
  isRolling: boolean;
  attackerDice: number | null;
  defenderDice: number | null;
  isPlayerAttacking: boolean;
  attackerName?: string;
  defenderName?: string;
}

export const TeamDiceRollDisplay = ({
  isRolling,
  attackerDice,
  defenderDice,
  isPlayerAttacking,
  attackerName,
  defenderName
}: TeamDiceRollDisplayProps) => {
  return (
    <AnimatePresence>
      {isRolling && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-between px-8">
          {/* Attacker Dice - Left or Right based on who's attacking */}
          <motion.div
            initial={{ scale: 0, opacity: 0, x: isPlayerAttacking ? -100 : 100 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: 1,
              x: 0,
              rotate: [0, 360, 720]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`${isPlayerAttacking ? 'order-1' : 'order-2'}`}
          >
            <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-6 shadow-2xl shadow-red-500/50 border-2 border-red-300">
              <div className="text-xs text-red-100 mb-2 text-center font-medium">
                ⚔️ Атака
              </div>
              <div className="text-5xl font-bold text-white text-center">
                {attackerDice}
              </div>
              {attackerName && (
                <div className="text-xs text-red-100 mt-2 text-center truncate max-w-[120px]">
                  {attackerName}
                </div>
              )}
            </div>
          </motion.div>

          {/* VS Indicator */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-primary animate-pulse"
          >
            VS
          </motion.div>

          {/* Defender Dice - Right or Left based on who's attacking */}
          <motion.div
            initial={{ scale: 0, opacity: 0, x: isPlayerAttacking ? 100 : -100 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: 1,
              x: 0,
              rotate: [0, -360, -720]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`${isPlayerAttacking ? 'order-2' : 'order-1'}`}
          >
            <div className="bg-blue-500/90 backdrop-blur-sm rounded-lg p-6 shadow-2xl shadow-blue-500/50 border-2 border-blue-300">
              <div className="text-xs text-blue-100 mb-2 text-center font-medium">
                🛡️ Защита
              </div>
              <div className="text-5xl font-bold text-white text-center">
                {defenderDice}
              </div>
              {defenderName && (
                <div className="text-xs text-blue-100 mt-2 text-center truncate max-w-[120px]">
                  {defenderName}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
