import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateCard } from '@/utils/cardUtils';
import { Card as CardType } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface FirstTimePackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstTimePackDialog = ({ isOpen, onClose }: FirstTimePackDialogProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardType | null>(null);
  const { toast } = useToast();

  const handleOpenPack = () => {
    setIsOpening(true);
    
    // Небольшая задержка для эффекта
    setTimeout(() => {
      const newCard = generateCard(Math.random() > 0.5 ? 'character' : 'pet');
      setRevealedCard(newCard);
      
      // Сохраняем карту в localStorage
      const savedCards = localStorage.getItem('gameCards');
      const currentCards = savedCards ? JSON.parse(savedCards) : [];
      const updatedCards = [...currentCards, newCard];
      localStorage.setItem('gameCards', JSON.stringify(updatedCards));

      // Отправляем событие обновления карт
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards: updatedCards }
      });
      window.dispatchEvent(cardsEvent);

      toast({
        title: "Поздравляем!",
        description: `Вы получили ${newCard.name} (${newCard.type === 'character' ? 'Герой' : 'Питомец'})!`,
      });

      setIsOpening(false);
    }, 2000);
  };

  const handleClose = () => {
    if (revealedCard) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-game-surface border-game-accent max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-game-accent flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-yellow-400" />
            Добро пожаловать!
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-400">
            Получите бесплатную стартовую карту для начала игры
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-6 p-4">
          {!revealedCard && !isOpening && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="mx-auto w-32 h-48 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
              
              <div className="space-y-2">
                <p className="text-game-accent font-medium">
                  Получите бесплатную стартовую карту!
                </p>
                <p className="text-gray-400 text-sm">
                  Нажмите, чтобы открыть колоду и получить случайного Героя или Питомца
                </p>
              </div>

              <Button
                onClick={handleOpenPack}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
              >
                <Gift className="w-4 h-4 mr-2" />
                Открыть бесплатную колоду
              </Button>
            </motion.div>
          )}

          {isOpening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="mx-auto w-32 h-48 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-16 h-16 text-white" />
                </motion.div>
              </div>
              
              <p className="text-game-accent font-medium animate-pulse">
                Открываем колоду...
              </p>
            </motion.div>
          )}

          {revealedCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="p-4 bg-game-background border-game-accent">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-game-accent">
                    {revealedCard.name}
                  </h3>
                  <p className="text-game-secondary">
                    {revealedCard.type === 'character' ? 'Герой' : 'Питомец'}
                  </p>
                  <p className="text-yellow-400 font-medium">
                    Редкость: {revealedCard.rarity}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-red-500/20 p-2 rounded">
                      <span className="text-red-400">Сила: {revealedCard.power}</span>
                    </div>
                    <div className="bg-blue-500/20 p-2 rounded">
                      <span className="text-blue-400">Защита: {revealedCard.defense}</span>
                    </div>
                    <div className="bg-green-500/20 p-2 rounded col-span-2">
                      <span className="text-green-400">Здоровье: {revealedCard.health}</span>
                    </div>
                  </div>
                  {revealedCard.faction && (
                    <p className="text-purple-400 text-sm">
                      Фракция: {revealedCard.faction}
                    </p>
                  )}
                </div>
              </Card>

              <Button
                onClick={handleClose}
                className="w-full bg-game-accent hover:bg-game-accent/80"
              >
                Продолжить игру
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};