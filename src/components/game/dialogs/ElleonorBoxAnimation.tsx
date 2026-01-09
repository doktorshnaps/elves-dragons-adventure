import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { SkipForward, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mgtTokenImg from "@/assets/items/mgt-token.webp";

interface ElleonorBoxAnimationProps {
  winningAmount: number;
  onAnimationComplete: () => void;
  onSkipAll?: () => void;
  showSkipAll?: boolean;
}

// Possible reward amounts for the animation
const REWARD_AMOUNTS = [1, 5, 10, 15, 20, 50, 100, 1000, 6666];

export const ElleonorBoxAnimation = ({ 
  winningAmount, 
  onAnimationComplete, 
  onSkipAll, 
  showSkipAll 
}: ElleonorBoxAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationDuration = 8; // seconds
  
  const [targetX, setTargetX] = useState<number>(0);
  const [xStart, setXStart] = useState<number>(0);
  
  // Generate reward items for animation (mix of all possible amounts)
  const generateRewardItems = () => {
    const items: number[] = [];
    
    // Generate 25 random reward slots
    for (let i = 0; i < 25; i++) {
      // Weight lower values more heavily
      const weights = [30, 25, 15, 10, 8, 5, 4, 2, 1]; // weights for each amount
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      
      for (let j = 0; j < REWARD_AMOUNTS.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          items.push(REWARD_AMOUNTS[j]);
          break;
        }
      }
    }
    
    return items;
  };

  const [rewardItems] = useState(() => generateRewardItems());
  
  // Position the winning amount at index 12 (center of 25 items)
  const winningIndex = 12;
  const allItems = [...rewardItems.slice(0, winningIndex), winningAmount, ...rewardItems.slice(winningIndex)];

  // Card dimensions for positioning
  const cardWidth = 140;
  const cardGap = 16;
  
  // Calculate animation positions
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const winningCenter = winningIndex * (cardWidth + cardGap) + cardWidth / 2;
      setTargetX(centerX - winningCenter);
      setXStart(rect.width);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [containerRef, winningIndex]);

  // Animation timer
  useEffect(() => {
    if (!isAnimating) return;
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowResult(true);
      setTimeout(() => {
        onAnimationComplete();
      }, 2000); // Show result for 2 seconds
    }, animationDuration * 1000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete, animationDuration, isAnimating]);

  const handleSkip = () => {
    setIsAnimating(false);
    setShowResult(true);
    setTimeout(() => {
      onAnimationComplete();
    }, 1000);
  };

  const getAmountColor = (amount: number) => {
    if (amount >= 1000) return 'from-yellow-400 via-amber-500 to-orange-600';
    if (amount >= 100) return 'from-purple-500 via-violet-600 to-indigo-700';
    if (amount >= 50) return 'from-blue-400 via-blue-500 to-cyan-600';
    if (amount >= 20) return 'from-emerald-400 via-green-500 to-teal-600';
    return 'from-gray-400 via-gray-500 to-slate-600';
  };

  const getAmountGlow = (amount: number) => {
    if (amount >= 1000) return 'shadow-yellow-500/50';
    if (amount >= 100) return 'shadow-purple-500/50';
    if (amount >= 50) return 'shadow-blue-500/50';
    if (amount >= 20) return 'shadow-green-500/50';
    return 'shadow-gray-500/30';
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-4">
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-game-accent flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-yellow-400" />
            Открытие Elleonor Box
            <Coins className="w-8 h-8 text-yellow-400" />
          </h2>
          <p className="text-game-foreground/70 mt-2">Получите mGT токены!</p>
        </motion.div>

        {/* Animation container */}
        <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-b from-game-surface to-game-background border-2 border-game-accent/50">
          {/* Indicator line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-400 z-10 transform -translate-x-0.5 shadow-lg shadow-yellow-500/50">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
          </div>
          
          {/* Reward items container */}
          <div 
            ref={containerRef}
            className="absolute top-1/2 transform -translate-y-1/2 h-48"
            style={{ left: 0, right: 0 }}
          >
            <motion.div
              className="flex gap-4 items-center"
              initial={{ x: xStart }}
              animate={{ 
                x: isAnimating ? [xStart, targetX - 400, targetX] : targetX
              }}
              transition={{
                duration: animationDuration,
                ease: ['linear', 'easeOut'],
                times: [0, 0.7, 1]
              }}
            >
              {allItems.map((amount, index) => (
                <motion.div
                  key={`reward-${index}`}
                  className="flex-shrink-0"
                  animate={{
                    scale: index === winningIndex && !isAnimating ? 1.15 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div 
                    className={`
                      w-[140px] h-44 rounded-xl p-3 
                      bg-gradient-to-br ${getAmountColor(amount)} 
                      border-2 ${index === winningIndex && !isAnimating ? 'border-yellow-300' : 'border-white/20'}
                      shadow-lg ${index === winningIndex && !isAnimating ? getAmountGlow(amount) : ''}
                      flex flex-col items-center justify-between
                    `}
                  >
                    {/* Token Image */}
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-inner">
                      <img 
                        src={mgtTokenImg} 
                        alt="mGT Token"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Amount */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white drop-shadow-lg">
                        {amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        mGT
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Glow effect for winning position */}
          <AnimatePresence>
            {!isAnimating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-52 rounded-xl pointer-events-none ${
                  winningAmount >= 1000 ? 'bg-yellow-400/30' : 
                  winningAmount >= 100 ? 'bg-purple-500/30' : 
                  winningAmount >= 50 ? 'bg-blue-500/30' : 
                  'bg-green-500/30'
                }`}
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Result display */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-6 text-center"
            >
              <div className={`
                inline-flex items-center gap-4 px-8 py-4 rounded-xl
                bg-gradient-to-r ${getAmountColor(winningAmount)}
                shadow-2xl ${getAmountGlow(winningAmount)}
              `}>
                <img 
                  src={mgtTokenImg} 
                  alt="mGT Token"
                  className="w-12 h-12 rounded-full border-2 border-white/50"
                />
                <div className="text-white">
                  <div className="text-lg font-medium">Вы получили</div>
                  <div className="text-4xl font-bold">{winningAmount.toLocaleString()} mGT</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress indicator and skip button */}
        <div className="mt-6 text-center">
          {isAnimating ? (
            <div className="space-y-3">
              <div className="text-game-accent text-lg font-bold animate-pulse">
                Крутим награду...
              </div>
              <div className="w-full max-w-md mx-auto bg-game-surface rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 h-2 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: animationDuration, ease: "linear" }}
                />
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                  className="bg-game-surface/50 border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-colors"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Пропустить
                </Button>
                {showSkipAll && onSkipAll && (
                  <Button
                    onClick={onSkipAll}
                    variant="default"
                    size="sm"
                    className="bg-game-primary hover:bg-game-primary/80 text-white"
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
