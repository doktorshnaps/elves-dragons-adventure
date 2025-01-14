import { motion, AnimatePresence } from "framer-motion";
import { Dice6 } from "lucide-react";

interface DungeonDisplayProps {
  rolling: boolean;
  selectedDungeon: string | null;
}

export const DungeonDisplay = ({ rolling, selectedDungeon }: DungeonDisplayProps) => {
  return (
    <>
      <motion.div
        animate={{ rotate: rolling ? 360 : 0 }}
        transition={{ duration: 1, repeat: rolling ? Infinity : 0 }}
        className="mb-6"
      >
        <Dice6 className="w-20 h-20 mx-auto text-game-accent" />
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedDungeon && (
          <motion.div
            key={selectedDungeon}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <p className="text-xl text-game-accent">
              {selectedDungeon}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};