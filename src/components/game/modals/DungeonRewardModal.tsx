import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Trophy, Sword } from 'lucide-react';
import { DungeonReward } from '@/hooks/adventure/useDungeonRewards';

interface DungeonRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: DungeonReward;
}

export const DungeonRewardModal: React.FC<DungeonRewardModalProps> = ({
  isOpen,
  onClose,
  reward
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Награда за подземелье
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Общая награда */}
          <Card className="border-primary/20 bg-background/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-8 h-8 text-yellow-500" />
                <span className="text-3xl font-bold text-primary">
                  {reward.totalELL}
                </span>
                <span className="text-lg text-muted-foreground">ELL</span>
              </div>
              {reward.isFullCompletion && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                  Полное завершение подземелья!
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Детализация по уровням */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sword className="w-4 h-4" />
              Убито монстров:
            </h3>
            
            {reward.breakdown.level1to3.count > 0 && (
              <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                <span className="text-sm">
                  Уровни 1-3: {reward.breakdown.level1to3.count} монстров
                </span>
                <Badge variant="outline">
                  {reward.breakdown.level1to3.reward} ELL
                </Badge>
              </div>
            )}
            
            {reward.breakdown.level4to7.count > 0 && (
              <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                <span className="text-sm">
                  Уровни 4-7: {reward.breakdown.level4to7.count} монстров
                </span>
                <Badge variant="outline">
                  {reward.breakdown.level4to7.reward} ELL
                </Badge>
              </div>
            )}
            
            {reward.breakdown.level8to10.count > 0 && (
              <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                <span className="text-sm">
                  Уровни 8-10: {reward.breakdown.level8to10.count} монстров
                </span>
                <Badge variant="outline">
                  {reward.breakdown.level8to10.reward} ELL
                </Badge>
              </div>
            )}

            {reward.completionBonus > 0 && (
              <div className="flex justify-between items-center p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                <span className="text-sm text-yellow-300">
                  Бонус за завершение
                </span>
                <Badge className="bg-yellow-500/20 text-yellow-300">
                  {reward.completionBonus} ELL
                </Badge>
              </div>
            )}
          </div>

          <Button 
            onClick={onClose} 
            className="w-full"
            size="lg"
          >
            Забрать награду
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};