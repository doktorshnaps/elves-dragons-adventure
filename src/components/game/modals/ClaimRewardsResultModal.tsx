import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, TrendingUp, Package, Sparkles } from 'lucide-react';

interface ClaimRewardsResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: {
    ell_reward: number;
    experience_reward: number;
    items: Array<{
      name: string;
      type: string;
      quantity?: number;
    }>;
  };
}

export const ClaimRewardsResultModal: React.FC<ClaimRewardsResultModalProps> = ({
  isOpen,
  onClose,
  rewards
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Награды получены!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* ELL награда */}
          {rewards.ell_reward > 0 && (
            <Card className="border-primary/20 bg-background/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Получено валюты</div>
                    <div className="text-2xl font-bold text-yellow-500">
                      +{rewards.ell_reward} ELL
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Опыт */}
          {rewards.experience_reward > 0 && (
            <Card className="border-primary/20 bg-background/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Получено опыта</div>
                    <div className="text-2xl font-bold text-blue-500">
                      +{rewards.experience_reward} XP
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Предметы */}
          {rewards.items && rewards.items.length > 0 && (
            <Card className="border-primary/20 bg-background/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="w-4 h-4" />
                  Полученные предметы:
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {rewards.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/50"
                    >
                      <div className="text-sm font-medium">{item.name}</div>
                      {item.quantity && item.quantity > 1 && (
                        <div className="text-xs text-primary font-bold">x{item.quantity}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Кнопка закрытия */}
          <Button 
            onClick={onClose} 
            className="w-full" 
            size="lg"
          >
            Отлично!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};