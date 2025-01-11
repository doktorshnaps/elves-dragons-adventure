import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Card as CardType } from "@/types/cards";
import { getRarityLabel } from "@/utils/cardUtils";

interface CardAnimationProps {
  card: CardType;
}

export const CardAnimation = ({ card }: CardAnimationProps) => {
  return (
    <motion.div
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      exit={{ scale: 0, rotateY: 180 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <Card className="p-6 bg-game-background border-game-accent animate-card-glow">
        <h3 className="text-xl font-bold text-game-accent mb-2">{card.name}</h3>
        <p className="text-gray-400">Тип: {card.type === 'character' ? 'Герой' : 'Питомец'}</p>
        <div className="mt-4 flex gap-4 justify-center">
          <div className="text-game-accent">
            <span>Атака: {card.power}</span>
          </div>
          <div className="text-game-accent">
            <span>Защита: {card.defense}</span>
          </div>
          <div className="text-game-accent">
            <span>Редкость: {getRarityLabel(card.rarity)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};