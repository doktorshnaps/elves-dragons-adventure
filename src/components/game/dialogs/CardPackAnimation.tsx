import { useState, useEffect, useRef, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cardDatabase } from "@/data/cardDatabase";
import { calculateCardStats } from "@/utils/cardUtils";

interface CardPackAnimationProps {
  winningCard: CardType;
  onAnimationComplete: () => void;
  onSkipAll?: () => void;
  showSkipAll?: boolean;
}

export const CardPackAnimation = ({ winningCard, onAnimationComplete, onSkipAll, showSkipAll }: CardPackAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [availableImages, setAvailableImages] = useState<{[key: string]: string}>({});
  const imagesReady = Object.keys(availableImages).length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const animationDuration = 10; // seconds
  
  // Local database image map as immediate fallback
  const dbImageMap = useMemo(() => {
    const map: {[key: string]: string} = {};
    cardDatabase.forEach((c: any) => {
      if (c?.name && c?.image) map[c.name] = c.image as string;
    });
    return map;
  }, []);

  // Seed available images from local DB first and preload them
  useEffect(() => {
    setAvailableImages(dbImageMap);
    
    // Preload the first few images for better performance
    const imagesToPreload = Object.values(dbImageMap).slice(0, 10);
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [dbImageMap]);
  
  const [targetX, setTargetX] = useState<number>(0);
  const [xStart, setXStart] = useState<number>(0);
  
  // Remove this useEffect that was overriding the images from cardDatabase
  // The images are already loaded from dbImageMap in the previous useEffect
  
  // Generate dummy cards for animation using actual card data
  const generateDummyCards = (): CardType[] => {
    const dummyCards: CardType[] = [];
    
    if (Object.keys(availableImages).length === 0) return [];
    
    // Get all available cards from database
    const allCards = cardDatabase.filter((c: any) => c?.name && c?.image && availableImages[c.name]);
    
    if (allCards.length === 0) return [];
    
    for (let i = 0; i < 20; i++) {
      // Randomly select a card from database
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      
      // All cards now have rarity 1
      const stats = calculateCardStats(randomCard.name, 1, randomCard.type);
      
      // Use actual card data with proper structure
      dummyCards.push({
        id: `dummy-${i}`,
        name: randomCard.name,
        type: randomCard.type,
        power: stats.power,
        defense: stats.defense,
        health: stats.health,
        magic: stats.magic,
        rarity: 1, // All cards are now 1 star
        faction: (randomCard.faction || 'Каледор') as any,
        image: availableImages[randomCard.name],
      });
    }
    
    return dummyCards;
  };

  // Generate cards only when images are loaded
  const dummyCards = imagesReady ? generateDummyCards() : [];
  
  // Simplified positioning - place winning card at fixed position in array
  const winningCardIndex = 10; // Adjusted for smaller array (was 20)
  const allCards = dummyCards.length > 0 ? [...dummyCards.slice(0, winningCardIndex), winningCard, ...dummyCards.slice(winningCardIndex)] : [];

  // Simple calculation for card positioning
  const cardWidth = 128; // w-32
  const cardGap = 16; // gap-4
  
  // Measure container width and compute exact targetX in pixels
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const winningCenter = winningCardIndex * (cardWidth + cardGap) + cardWidth / 2;
      setTargetX(centerX - winningCenter);
      setXStart(rect.width);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [containerRef, winningCardIndex]);

  useEffect(() => {
    if (!isAnimating) return;
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onAnimationComplete();
      }, 300);
    }, animationDuration * 1000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete, animationDuration, isAnimating]);

  const handleSkip = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onAnimationComplete();
    }, 300);
  };

  const getRarityColor = (rarity: number) => {
    // All cards are now 1 star, use a consistent gradient
    return 'from-purple-500 to-blue-600';
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
            className="absolute top-1/2 transform -translate-y-1/2 h-60 flex items-center"
            style={{ left: 0, right: 0 }}
          >
            <motion.div
              className="flex gap-4"
              initial={{ x: xStart }}
              animate={{ 
                x: isAnimating ? [xStart, targetX - 600, targetX] : targetX
              }}
              transition={{
                duration: animationDuration,
                ease: ['linear', 'easeOut'],
                times: [0, 0.6, 1]
              }}
            >
              {allCards.map((card, index) => (
                <motion.div
                  key={`${card.id}-${index}`}
                  className="flex-shrink-0"
                  animate={{
                    scale: index === winningCardIndex && !isAnimating ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={`w-32 h-52 p-2 bg-gradient-to-br ${getRarityColor(card.rarity)} border-2 ${
                    index === winningCardIndex && !isAnimating ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-400'
                  }`}>
                    <div className="flex flex-col h-full justify-between text-white">
                      {/* Card Image */}
                      <div className="w-full h-16 mb-1 overflow-hidden rounded">
                        <img 
                          src={card.image ?? availableImages[card.name] ?? '/placeholder.svg'} 
                          alt={card.name}
                          className="w-full h-full object-cover"
                          loading={index <= 15 ? "eager" : "lazy"} // Load first 15 cards eagerly
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
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
        
        {/* Progress indicator and skip button */}
        <div className="mt-4 text-center">
          <div className="text-game-accent text-lg font-bold">
            {isAnimating ? 'Открываем пак...' : 'Поздравляем!'}
          </div>
          {isAnimating ? (
            <div className="space-y-3">
              <div className="w-full bg-game-surface rounded-full h-2 mt-2">
                <motion.div
                  className="bg-gradient-to-r from-game-primary to-game-accent h-2 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: animationDuration, ease: "linear" }}
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                  className="bg-game-surface/50 border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-colors"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Пропустить анимацию
                </Button>
                {showSkipAll && onSkipAll && (
                  <Button
                    onClick={onSkipAll}
                    variant="default"
                    size="sm"
                    className="bg-game-primary hover:bg-game-primary/80 text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Пропустить все
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};