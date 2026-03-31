import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { resolveCardImageSync } from "@/utils/cardImageResolver";
import { getRarityStyle, getRarityBorderStyle } from "@/utils/rarityColors";

interface CardsSummaryGridProps {
  cards: CardType[];
  onClose: () => void;
}

export const CardsSummaryGrid = ({ cards, onClose }: CardsSummaryGridProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      style={{
        background: `radial-gradient(ellipse at center, 
          hsl(252, 85%, 20%) 0%, 
          hsl(220, 26%, 10%) 50%, 
          hsl(220, 26%, 6%) 100%)`,
      }}
    >
      <div className="w-full max-w-3xl mx-auto px-4 py-6 flex flex-col items-center min-h-full">
        {/* Title */}
        <motion.h2
          className="text-xl sm:text-2xl font-bold mb-2 tracking-wider text-center"
          style={{ color: 'hsl(291, 88%, 68%)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✨ ВСЕ ПОЛУЧЕННЫЕ КАРТЫ ✨
        </motion.h2>
        <p className="text-sm mb-4" style={{ color: 'hsl(252, 85%, 76%, 0.6)' }}>
          Получено карт: {cards.length}
        </p>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full mb-6">
          {cards.map((card, index) => {
            const displayRarity = card.rarity;
            const rarityStyle = getRarityStyle(displayRarity);

            return (
              <motion.div
                key={`${card.id}-${index}`}
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
              >
                <div
                  className={`p-2 rounded-lg border-2 ${rarityStyle.shimmer ? (displayRarity === 9 ? 'rarity-shimmer rarity-diamond' : 'rarity-shimmer') : ''}`}
                  style={{
                    ...getRarityBorderStyle(displayRarity, true),
                    background: 'hsl(220, 26%, 14%)',
                  }}
                >
                  <div className="flex flex-col text-white">
                    {/* Card Image */}
                    <div className="w-full h-20 sm:h-24 mb-1 overflow-hidden rounded-md">
                      <img
                        src={resolveCardImageSync(card) ?? '/placeholder.svg'}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold truncate">{card.name}</h3>
                    <p className="text-[10px] sm:text-xs opacity-60">
                      {card.type === 'character' ? 'Герой' : 'Дракон'} • {card.faction || ''}
                    </p>

                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: displayRarity }, (_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] sm:text-xs mt-1">
                      <div className="text-center">
                        <span className="font-bold">{card.power}</span>
                        <span style={{ color: 'hsl(0, 80%, 70%)' }}> ⚔</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold">{card.defense}</span>
                        <span style={{ color: 'hsl(210, 80%, 70%)' }}> 🛡</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold">{card.health}</span>
                        <span style={{ color: 'hsl(120, 60%, 60%)' }}> ♥</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Collect all button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pb-6"
        >
          <Button
            onClick={onClose}
            className="px-8 py-3 text-white font-bold text-base transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, hsl(252, 85%, 50%), hsl(291, 88%, 50%))`,
              boxShadow: `0 0 20px hsl(291, 88%, 68%, 0.3)`,
            }}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Добавить все в коллекцию
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
