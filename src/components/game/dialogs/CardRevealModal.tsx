import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card as CardType } from "@/types/cards";
import { CardDisplay } from "../CardDisplay";
import { Sparkles, Star } from "lucide-react";

interface CardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  revealedCard: CardType | null;
  onNextCard?: () => void;
  currentIndex?: number;
  totalCards?: number;
}

export const CardRevealModal = ({ 
  isOpen, 
  onClose, 
  revealedCard, 
  onNextCard, 
  currentIndex = 0, 
  totalCards = 1 
}: CardRevealModalProps) => {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (revealedCard) {
      setShowCard(false);
      const timer = setTimeout(() => setShowCard(true), 500);
      return () => clearTimeout(timer);
    }
  }, [revealedCard]);

  const handleOpen = () => {
    setTimeout(() => setShowCard(true), 500);
  };

  const handleClose = () => {
    setShowCard(false);
    onClose();
  };

  if (!revealedCard) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleClose}
    >
      <DialogContent 
        className="max-w-md bg-game-surface border-game-accent"
        onOpenAutoFocus={handleOpen}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-game-accent flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            {totalCards > 1 ? `Карта ${currentIndex + 1} из ${totalCards}` : 'Новая карта!'}
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {!showCard ? (
            <div className="w-40 h-56 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center animate-pulse">
              <div className="text-white text-lg font-bold">?</div>
            </div>
          ) : (
            <div className="relative animate-in zoom-in-50 duration-500">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-30 animate-pulse"></div>
              <div className="relative">
                <CardDisplay 
                  card={revealedCard} 
                  showSellButton={false}
                  isActive={true}
                />
              </div>
            </div>
          )}

          {showCard && (
            <div className="text-center space-y-2 animate-in fade-in-50 duration-700">
              <h3 className="text-lg font-bold text-game-accent">{revealedCard.name}</h3>
              <p className="text-sm text-game-accent/70">
                {revealedCard.type === 'character' ? 'Герой' : 'Дракон'} • {revealedCard.faction || 'Без фракции'}
              </p>
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: revealedCard.rarity }, (_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-4">
                <div className="text-center">
                  <div className="text-red-400 font-bold">{revealedCard.power}</div>
                  <div className="text-game-accent/70">Сила</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">{revealedCard.defense}</div>
                  <div className="text-game-accent/70">Защита</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold">{revealedCard.health}</div>
                  <div className="text-game-accent/70">Здоровье</div>
                </div>
              </div>
            </div>
          )}

          {showCard && (
            <Button 
              onClick={() => {
                if (onNextCard && currentIndex < totalCards - 1) {
                  setShowCard(false);
                  setTimeout(() => onNextCard(), 300);
                } else {
                  handleClose();
                }
              }}
              className="bg-game-primary hover:bg-game-primary/80 animate-in fade-in-50 duration-1000"
            >
              {currentIndex < totalCards - 1 ? 'Следующая карта' : 'Добавить в коллекцию'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};