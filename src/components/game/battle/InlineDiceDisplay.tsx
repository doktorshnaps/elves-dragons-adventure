import { motion, AnimatePresence } from 'framer-motion';

interface InlineDiceDisplayProps {
  isRolling: boolean;
  diceValue: number | null;
  isAttacker: boolean;
  label?: string;
}

export const InlineDiceDisplay = ({
  isRolling,
  diceValue,
  isAttacker,
  label
}: InlineDiceDisplayProps) => {
  return (
    <AnimatePresence>
      {isRolling && diceValue !== null && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            opacity: 1,
            rotate: [0, 360, 720]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className={`${
            isAttacker 
              ? 'bg-red-500/90 border-red-300 shadow-red-500/50' 
              : 'bg-blue-500/90 border-blue-300 shadow-blue-500/50'
          } backdrop-blur-sm rounded-lg p-3 shadow-xl border-2`}>
            <div className={`text-xs ${isAttacker ? 'text-red-100' : 'text-blue-100'} mb-1 text-center font-medium`}>
              {isAttacker ? '⚔️' : '🛡️'} {label || (isAttacker ? 'Атака' : 'Защита')}
            </div>
            <div className="text-3xl font-bold text-white text-center">
              {diceValue}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
