import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, SkipForward, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cardDatabase } from "@/data/cardDatabase";
import { calculateCardStats } from "@/utils/cardUtils";
import { resolveCardImageSync } from "@/utils/cardImageResolver";
import { getRarityStyle, getRarityBorderStyle, getCardRarityByName } from "@/utils/rarityColors";

interface CardPackAnimationProps {
  winningCard: CardType;
  onAnimationComplete: () => void;
  onSkipAll?: () => void;
  showSkipAll?: boolean;
  onNextCard?: () => void;
  onClose?: () => void;
  currentIndex?: number;
  totalCards?: number;
}

// Particle component for winning effect
const WinParticle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      background: `radial-gradient(circle, hsl(291, 88%, 68%), hsl(252, 85%, 76%))`,
      left: '50%',
      top: '50%',
    }}
    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0, 1.5, 1, 0],
      x: [0, x * 0.5, x],
      y: [0, y * 0.5, y],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: "easeOut",
    }}
  />
);

export const CardPackAnimation = ({ winningCard, onAnimationComplete, onSkipAll, showSkipAll, onNextCard, onClose, currentIndex = 0, totalCards = 1 }: CardPackAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const [availableImages, setAvailableImages] = useState<{[key: string]: string}>({});
  const imagesReady = Object.keys(availableImages).length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const ANIM_TOTAL = 8.0;
  const ANIM_SPIN_PHASE = 6.5;
  const ANIM_SLOWDOWN_PHASE = 1.5;
  const FAST_OPEN_DURATION = 1.2;
  const [skipped, setSkipped] = useState(false);

  // Local database image map
  const dbImageMap = useMemo(() => {
    const map: {[key: string]: string} = {};
    cardDatabase.forEach((c: any) => {
      if (c?.name && c?.image) map[c.name] = c.image as string;
    });
    return map;
  }, []);

  useEffect(() => {
    setAvailableImages(dbImageMap);
    const imagesToPreload = Object.values(dbImageMap).slice(0, 10);
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [dbImageMap]);

  const [targetX, setTargetX] = useState<number>(0);
  const [xStart, setXStart] = useState<number>(0);

  const generateDummyCards = useCallback((): CardType[] => {
    const dummyCards: CardType[] = [];
    if (Object.keys(availableImages).length === 0) return [];
    const allCards = cardDatabase.filter((c: any) => c?.name && c?.image && availableImages[c.name]);
    if (allCards.length === 0) return [];

    for (let i = 0; i < 80; i++) {
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const cardRarity = getCardRarityByName(randomCard.name, randomCard.type) as CardType['rarity'];
      const stats = calculateCardStats(randomCard.name, cardRarity, randomCard.type);
      dummyCards.push({
        id: `dummy-${i}`,
        name: randomCard.name,
        type: randomCard.type,
        power: stats.power,
        defense: stats.defense,
        health: stats.health,
        magic: stats.magic,
        rarity: cardRarity,
        faction: (randomCard.faction || 'Каледор') as any,
        image: availableImages[randomCard.name],
      });
    }
    return dummyCards;
  }, [availableImages]);

  const dummyCards = useMemo(() => imagesReady ? generateDummyCards() : [], [imagesReady, generateDummyCards]);

  const winningCardIndex = 65;
  const allCards = useMemo(
    () => dummyCards.length > 0 ? [...dummyCards.slice(0, winningCardIndex), winningCard, ...dummyCards.slice(winningCardIndex)] : [],
    [dummyCards, winningCard]
  );

  const cardWidth = 144; // w-36
  const cardGap = 16;

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const winningCenter = winningCardIndex * (cardWidth + cardGap) + cardWidth / 2;
      setTargetX(centerX - winningCenter);
      setXStart(rect.width + 200);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowWinEffect(true);
    }, ANIM_TOTAL * 1000);
    return () => clearTimeout(timer);
  }, [ANIM_TOTAL, isAnimating]);

  const handleSkip = () => {
    setSkipped(true);
    setIsAnimating(false);
    setShowWinEffect(true);
  };

  const handleCollect = () => {
    if (onNextCard && currentIndex < totalCards - 1) {
      onNextCard();
    } else if (onClose) {
      onClose();
    } else {
      onAnimationComplete();
    }
  };

  // Generate particles for win effect
  const particles = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      return {
        delay: Math.random() * 0.3,
        x: Math.cos(angle) * (80 + Math.random() * 60),
        y: Math.sin(angle) * (80 + Math.random() * 60),
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, 
            hsl(252, 85%, 20%) 0%, 
            hsl(220, 26%, 10%) 50%, 
            hsl(220, 26%, 6%) 100%)`,
        }}
        animate={{
          background: isAnimating ? [
            `radial-gradient(ellipse at center, hsl(252, 85%, 20%) 0%, hsl(220, 26%, 10%) 50%, hsl(220, 26%, 6%) 100%)`,
            `radial-gradient(ellipse at center, hsl(291, 88%, 25%) 0%, hsl(220, 26%, 12%) 50%, hsl(220, 26%, 6%) 100%)`,
            `radial-gradient(ellipse at center, hsl(252, 85%, 20%) 0%, hsl(220, 26%, 10%) 50%, hsl(220, 26%, 6%) 100%)`,
          ] : undefined,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ambient glow orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'hsl(291, 88%, 68%)' }}
        animate={{
          x: [-50, 50, -50],
          y: [-30, 30, -30],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-6xl mx-4 flex flex-col items-center justify-center">
        {/* Title */}
        <motion.h2
          className="text-2xl font-bold mb-6 tracking-wider"
          style={{ color: 'hsl(291, 88%, 68%)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          ✨ ОТКРЫТИЕ КОЛОДЫ ✨
        </motion.h2>

        {/* Main animation container */}
        <div className="relative h-80 w-full overflow-hidden rounded-2xl border-2"
          style={{
            borderColor: 'hsl(252, 85%, 40%)',
            background: `linear-gradient(180deg, 
              hsl(220, 26%, 12%) 0%, 
              hsl(295, 9%, 18%) 50%, 
              hsl(220, 26%, 12%) 100%)`,
            boxShadow: `0 0 40px hsl(252, 85%, 40%, 0.3), inset 0 0 60px hsl(252, 85%, 20%, 0.2)`,
          }}
        >
          {/* Top indicator triangle */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown
                className="w-8 h-8 drop-shadow-lg"
                style={{ color: 'hsl(291, 88%, 68%)' }}
              />
            </motion.div>
          </div>

          {/* Bottom indicator triangle */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronUp
                className="w-8 h-8 drop-shadow-lg"
                style={{ color: 'hsl(291, 88%, 68%)' }}
              />
            </motion.div>
          </div>

          {/* Center selection glow line */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-[3px] z-10 transform -translate-x-[1.5px]"
            style={{
              background: `linear-gradient(180deg, transparent 0%, hsl(291, 88%, 68%) 30%, hsl(291, 88%, 68%) 70%, transparent 100%)`,
              boxShadow: `0 0 12px hsl(291, 88%, 68%, 0.6), 0 0 24px hsl(291, 88%, 68%, 0.3)`,
            }}
          />

          {/* Left gradient mask */}
          <div
            className="absolute top-0 bottom-0 left-0 w-32 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, hsl(220, 26%, 12%) 0%, transparent 100%)`,
            }}
          />

          {/* Right gradient mask */}
          <div
            className="absolute top-0 bottom-0 right-0 w-32 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(270deg, hsl(220, 26%, 12%) 0%, transparent 100%)`,
            }}
          />

          {/* Cards container */}
          <div
            ref={containerRef}
            className="absolute top-1/2 transform -translate-y-1/2 h-64 flex items-center"
            style={{ left: 0, right: 0 }}
          >
            <motion.div
              className="flex gap-4"
              initial={{ x: xStart }}
              animate={{ x: skipped ? targetX : [xStart, targetX + (targetX - xStart) * 0.05, targetX] }}
              transition={skipped ? {
                duration: FAST_OPEN_DURATION,
                ease: "easeOut",
              } : {
                duration: ANIM_TOTAL,
                times: [0, ANIM_SPIN_PHASE / ANIM_TOTAL, 1],
                ease: ["linear", "easeOut"],
              }}
            >
              {allCards.map((card, index) => {
                const isWinner = index === winningCardIndex;
                const isWinRevealed = isWinner && showWinEffect;
                const displayRarity = getCardRarityByName(card.name, card.type, card.rarity);
                const rarityStyle = getRarityStyle(displayRarity);

                return (
                  <motion.div
                    key={`${card.id}-${index}`}
                    className="flex-shrink-0 relative"
                    animate={{
                      scale: isWinRevealed ? 1.2 : (isWinner && !isAnimating ? 1.05 : (isAnimating ? 1 : 0.85)),
                      opacity: isWinRevealed ? 1 : (isWinner && !isAnimating ? 1 : (isAnimating ? 1 : 0.4)),
                      filter: isWinRevealed ? 'brightness(1.2)' : (isWinner && !isAnimating ? 'brightness(1)' : (isAnimating ? 'brightness(1)' : 'brightness(0.5)')),
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {/* Win glow behind card */}
                    {isWinRevealed && (
                      <motion.div
                        className="absolute -inset-3 rounded-xl pointer-events-none z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.8, 0.5] }}
                        transition={{ duration: 0.8 }}
                        style={{
                          background: `radial-gradient(ellipse, ${rarityStyle.glowColor} 0%, hsl(291, 88%, 68%, 0.18) 55%, transparent 75%)`,
                          boxShadow: `0 0 30px ${rarityStyle.glowColor}, 0 0 60px hsl(291, 88%, 68%, 0.25)`,
                        }}
                      />
                    )}

                    {/* Particles on win */}
                    {isWinRevealed && particles.map((p, pi) => (
                      <WinParticle key={pi} delay={p.delay} x={p.x} y={p.y} />
                    ))}

                    <div
                      className={`w-36 h-56 p-2 relative z-10 rounded-lg transition-all duration-300 ${
                        isWinRevealed ? 'border-2' : 'border'
                      } ${rarityStyle.shimmer ? (displayRarity === 9 ? 'rarity-shimmer rarity-diamond' : 'rarity-shimmer') : ''}`}
                      style={getRarityBorderStyle(displayRarity, isWinRevealed)}
                    >
                      <div className="flex flex-col h-full justify-between text-white">
                        {/* Card Image */}
                        <div className="w-full h-20 mb-1 overflow-hidden rounded-md">
                          <img
                            src={resolveCardImageSync(card) ?? availableImages[card.name] ?? '/placeholder.svg'}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            loading={index <= 15 ? "eager" : "lazy"}
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold truncate">{card.name}</h3>
                          <p className="text-xs opacity-70">
                            {card.type === 'character' ? 'Герой' : 'Питомец'}
                          </p>
                          <p className="text-xs opacity-50">{card.faction}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: displayRarity }, (_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div className="text-center">
                              <div className="font-bold">{card.power}</div>
                              <div style={{ color: 'hsl(0, 80%, 70%)' }}>⚔</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold">{card.defense}</div>
                              <div style={{ color: 'hsl(210, 80%, 70%)' }}>🛡</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold">{card.health}</div>
                              <div style={{ color: 'hsl(120, 60%, 60%)' }}>♥</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

        </div>

        {/* Win banner - outside the overflow container */}
        <AnimatePresence>
          {showWinEffect && (
            <motion.div
              className="relative z-30 mt-4"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div
                className="px-8 py-2.5 rounded-full text-sm font-bold tracking-wider whitespace-nowrap"
                style={{
                  background: `linear-gradient(90deg, hsl(252, 85%, 40%, 0.9), hsl(291, 88%, 40%, 0.9))`,
                  color: 'hsl(45, 100%, 80%)',
                  boxShadow: `0 0 20px hsl(291, 88%, 68%, 0.4)`,
                  border: `1px solid hsl(45, 100%, 60%, 0.5)`,
                }}
              >
                ✨ ВАША ДОБЫЧА! ✨
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress & buttons */}
        <div className="mt-4 text-center relative z-10 w-full max-w-md">
          {isAnimating ? (
            <div className="space-y-4">
              <motion.div
                className="text-lg font-bold mb-1"
                style={{ color: 'hsl(291, 88%, 68%)' }}
              >
                Открываем пак...
              </motion.div>
              {/* Progress bar */}
              <div
                className="w-full rounded-full h-1.5 overflow-hidden"
                style={{ background: 'hsl(295, 9%, 25%)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(252, 85%, 76%), hsl(291, 88%, 68%))`,
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: ANIM_TOTAL, ease: "linear" }}
                />
              </div>

              {/* Skip buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                  className="border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-colors backdrop-blur-sm"
                  style={{
                    background: 'hsl(295, 9%, 25%, 0.5)',
                    borderColor: 'hsl(291, 88%, 68%, 0.6)',
                  }}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Пропустить
                </Button>
                {showSkipAll && onSkipAll && (
                  <Button
                    onClick={onSkipAll}
                    size="sm"
                    style={{
                      background: `linear-gradient(135deg, hsl(252, 85%, 50%), hsl(291, 88%, 50%))`,
                    }}
                    className="text-white hover:opacity-90 transition-opacity"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Пропустить все
                  </Button>
                )}
              </div>
            </div>
          ) : showWinEffect ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {/* Card info */}
              <div className="text-center">
                <h3 className="text-lg font-bold" style={{ color: 'hsl(291, 88%, 68%)' }}>
                  {winningCard.name}
                </h3>
                <p className="text-sm" style={{ color: 'hsl(252, 85%, 76%, 0.7)' }}>
                  {winningCard.type === 'character' ? 'Герой' : 'Дракон'} • {winningCard.faction || 'Без фракции'}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {Array.from({ length: winningCard.rarity }, (_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Collect button */}
              <Button
                onClick={handleCollect}
                className="px-8 py-2 text-white font-bold transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, hsl(252, 85%, 50%), hsl(291, 88%, 50%))`,
                  boxShadow: `0 0 20px hsl(291, 88%, 68%, 0.3)`,
                }}
              >
                {currentIndex < totalCards - 1 ? 'Следующая карта →' : 'Добавить в коллекцию'}
              </Button>

              {totalCards > 1 && (
                <p className="text-xs" style={{ color: 'hsl(252, 85%, 76%, 0.5)' }}>
                  Карта {currentIndex + 1} из {totalCards}
                </p>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
