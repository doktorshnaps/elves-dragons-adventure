import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Star } from 'lucide-react';

interface DungeonRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    balance: number;
    monstersKilled: number;
    totalLevels: number;
    dungeonCompleted: boolean;
  };
}

export const DungeonRewardModal: React.FC<DungeonRewardModalProps> = ({
  isOpen,
  onClose,
  reward
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {reward.dungeonCompleted ? 'Подземелье завершено!' : 'Команда погибла'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">+{reward.balance} ELL</span>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Убито монстров: {reward.monstersKilled}</p>
              <p>Пройдено уровней: {reward.totalLevels}</p>
              
              {reward.dungeonCompleted && (
                <div className="flex items-center justify-center gap-1 text-yellow-600 mt-2">
                  <Star className="w-4 h-4" />
                  <span className="font-medium">Бонус за завершение!</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Награда зачислена на ваш баланс
          </p>
          
          <Button onClick={onClose} className="w-full">
            Отлично!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};