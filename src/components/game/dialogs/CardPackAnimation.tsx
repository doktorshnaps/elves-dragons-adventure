import { useState, useEffect, useRef } from 'react';
import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface CardPackAnimationProps {
  winningCard: CardType;
  onAnimationComplete: () => void;
}

export const CardPackAnimation = ({ winningCard, onAnimationComplete }: CardPackAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate dummy cards for animation
  const generateDummyCards = (): CardType[] => {
    const dummyCards: CardType[] = [];
    const types: ('character' | 'pet')[] = ['character', 'pet'];
    const factions = ['Каледор', 'Сильванести', 'Фаэлин', 'Элленар', 'Тэлэрион', 'Аэлантир', 'Лиорас'];
    
    for (let i = 0; i < 50; i++) {
      dummyCards.push({
        id: `dummy-${i}`,
        name: `Карта ${i + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        power: Math.floor(Math.random() * 100) + 10,
        defense: Math.floor(Math.random() * 100) + 10,
        health: Math.floor(Math.random() * 200) + 50,
        magic: Math.floor(Math.random() * 50) + 5,
        rarity: (Math.floor(Math.random() * 8) + 1) as any,
        faction: factions[Math.floor(Math.random() * factions.length)] as any,
      });
    }
    
    return dummyCards;
  };

  const dummyCards = generateDummyCards();
  // Insert winning card at position 25 (middle)
  const allCards = [...dummyCards.slice(0, 25), winningCard, ...dummyCards.slice(25)];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onAnimationComplete();
      }, 1000);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const getRarityColor = (rarity: number) => {
    const colors = [
      'from-gray-400 to-gray-600',     // 1
      'from-green-400 to-green-600',   // 2
      'from-blue-400 to-blue-600',     // 3
      'from-purple-400 to-purple-600', // 4
      'from-pink-400 to-pink-600',     // 5
      'from-yellow-400 to-yellow-600', // 6
      'from-orange-400 to-orange-600', // 7
      'from-red-400 to-red-600',       // 8
    ];
    return colors[rarity - 1] || colors[0];
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-4">
        {/* Animation container */}
        <div className="relative h-80 overflow-hidden rounded-lg bg-game-surface border-2 border-game-accent">
          {/* Indicator line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-red-500 z-10 transform -translate-x-0.5">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>
          
          {/* Cards container */}
          <div 
            ref={containerRef}
            className="absolute top-1/2 transform -translate-y-1/2 h-60 flex items-center gap-4"
          >
            <motion.div
              className="flex gap-4"
              initial={{ x: '100vw' }}
              animate={{ 
                x: isAnimating ? ['-200vw', '-50vw'] : '-50vw'
              }}
              transition={{
                duration: isAnimating ? 10 : 1,
                ease: isAnimating ? "easeOut" : "easeInOut",
                times: isAnimating ? [0, 1] : undefined
              }}
            >
              {allCards.map((card, index) => (
                <motion.div
                  key={`${card.id}-${index}`}
                  className="flex-shrink-0"
                  animate={{
                    scale: index === 25 && !isAnimating ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={`w-32 h-52 p-2 bg-gradient-to-br ${getRarityColor(card.rarity)} border-2 ${
                    index === 25 && !isAnimating ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-400'
                  }`}>
                    <div className="flex flex-col h-full justify-between text-white">
                      <div>
                        <h3 className="text-sm font-bold truncate">{card.name}</h3>
                        <p className="text-xs opacity-80">{card.type === 'character' ? 'Герой' : 'Питомец'}</p>
                        <p className="text-xs opacity-70">{card.faction}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: card.rarity }, (_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center">
                            <div className="font-bold">{card.power}</div>
                            <div className="text-red-300">Сила</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{card.defense}</div>
                            <div className="text-blue-300">Защита</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{card.health}</div>
                            <div className="text-green-300">HP</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Glow effect for winning position */}
          {!isAnimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-60 bg-yellow-400/20 rounded-lg pointer-events-none"
            />
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 text-center">
          <div className="text-game-accent text-lg font-bold">
            {isAnimating ? 'Открываем пак...' : 'Поздравляем!'}
          </div>
          {isAnimating && (
            <div className="w-full bg-game-surface rounded-full h-2 mt-2">
              <motion.div
                className="bg-gradient-to-r from-game-primary to-game-accent h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 10, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};