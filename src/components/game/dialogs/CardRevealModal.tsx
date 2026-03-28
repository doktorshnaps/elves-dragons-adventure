import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { CardPackAnimation } from "./CardPackAnimation";
import { CardsSummaryGrid } from "./CardsSummaryGrid";

interface CardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  revealedCard: CardType | null;
  onNextCard?: () => void;
  currentIndex?: number;
  totalCards?: number;
  skipAnimations?: boolean;
  onSkipAll?: () => void;
  allCards?: CardType[];
}

export const CardRevealModal = ({ 
  isOpen, 
  onClose, 
  revealedCard, 
  onNextCard, 
  currentIndex = 0, 
  totalCards = 1,
  skipAnimations = false,
  onSkipAll,
  allCards = []
}: CardRevealModalProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (revealedCard && isOpen) {
      if (skipAnimations) {
        // Show summary of all cards instead of cycling
        setShowAnimation(false);
        setShowSummary(true);
      } else {
        setShowAnimation(true);
        setShowSummary(false);
      }
    }
  }, [revealedCard, isOpen, skipAnimations]);

  const handleClose = () => {
    setShowAnimation(false);
    setShowSummary(false);
    onClose();
  };

  const handleNextCard = () => {
    setShowAnimation(false);
    if (onNextCard) {
      setTimeout(() => {
        onNextCard();
      }, 100);
    }
  };

  const handleSkipAll = () => {
    // Trigger skip and show summary
    if (onSkipAll) onSkipAll();
  };

  if (!isOpen) return null;

  if (showSummary && allCards.length > 0) {
    return <CardsSummaryGrid cards={allCards} onClose={handleClose} />;
  }

  if (!revealedCard) return null;

  if (showAnimation) {
    return (
      <CardPackAnimation 
        winningCard={revealedCard} 
        onAnimationComplete={handleClose}
        onSkipAll={handleSkipAll}
        showSkipAll={totalCards > 1}
        onNextCard={handleNextCard}
        onClose={handleClose}
        currentIndex={currentIndex}
        totalCards={totalCards}
      />
    );
  }

  return null;
};
