import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { CardPackAnimation } from "./CardPackAnimation";

interface CardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  revealedCard: CardType | null;
  onNextCard?: () => void;
  currentIndex?: number;
  totalCards?: number;
  skipAnimations?: boolean;
  onSkipAll?: () => void;
}

export const CardRevealModal = ({ 
  isOpen, 
  onClose, 
  revealedCard, 
  onNextCard, 
  currentIndex = 0, 
  totalCards = 1,
  skipAnimations = false,
  onSkipAll
}: CardRevealModalProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (revealedCard && isOpen) {
      if (skipAnimations) {
        // Skip animation — go directly to next or close
        if (onNextCard && currentIndex < totalCards - 1) {
          onNextCard();
        } else {
          onClose();
        }
      } else {
        setShowAnimation(true);
      }
    }
  }, [revealedCard, isOpen, skipAnimations]);

  const handleClose = () => {
    setShowAnimation(false);
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

  if (!revealedCard || !isOpen) return null;

  if (showAnimation) {
    return (
      <CardPackAnimation 
        winningCard={revealedCard} 
        onAnimationComplete={handleClose}
        onSkipAll={onSkipAll}
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
