import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamPair } from '@/types/teamBattle';

interface AttackOrderSelectorProps {
  playerPairs: TeamPair[];
  attackOrder: string[];
  onOrderChange: (newOrder: string[]) => void;
  onStartBattle: () => void;
}

export const AttackOrderSelector: React.FC<AttackOrderSelectorProps> = ({
  playerPairs,
  attackOrder,
  onOrderChange,
  onStartBattle
}) => {
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);

  const handlePairClick = (pairId: string) => {
    let newOrder = [...selectedOrder];
    
    // Если пара уже выбрана, убираем её из порядка
    if (newOrder.includes(pairId)) {
      newOrder = newOrder.filter(id => id !== pairId);
    } else {
      // Добавляем пару в конец порядка
      newOrder.push(pairId);
    }
    
    setSelectedOrder(newOrder);
    onOrderChange(newOrder);
  };

  const getPairOrder = (pairId: string): number => {
    const index = selectedOrder.indexOf(pairId);
    return index === -1 ? 0 : index + 1;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Настройка порядка атаки
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Нажмите на пары, чтобы установить порядок атаки
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playerPairs.map((pair) => {
                const orderNumber = getPairOrder(pair.id);
                const isSelected = orderNumber > 0;
                
                return (
                  <div
                    key={pair.id}
                    onClick={() => handlePairClick(pair.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 border-primary shadow-lg'
                        : 'bg-card border-border hover:border-primary/50 hover:bg-card/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-sm ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {orderNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {pair.hero.name}
                          {pair.dragon && ` + ${pair.dragon.name}`}
                        </h4>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>💪 {pair.power}</span>
                          <span>🛡️ {pair.defense}</span>
                          <span>❤️ {pair.health}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isSelected ? 'Выбрано' : 'Нажмите для выбора'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={onStartBattle}
                className="px-6 py-2"
                disabled={selectedOrder.length === 0}
              >
                Начать бой
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Selection Panel at Bottom */}
      <div className="bg-game-surface/50 border-t border-game-accent/30 p-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-lg font-bold text-game-accent mb-3 text-center">
            Выбранная команда ({playerPairs.length}/5)
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, index) => {
              const pair = playerPairs[index];
              return (
                <div key={index} className="relative overflow-hidden border border-game-accent/30 rounded-lg p-2 min-h-[140px] bg-card/30">
                  {pair ? (
                    <div className="space-y-1">
                      <div className="text-xs text-game-accent font-medium text-center">Пара {index + 1}</div>
                      <div className="text-center">
                        <div className="text-xs text-game-accent/70">Герой</div>
                        <div className="text-xs font-medium text-primary">{pair.hero.name}</div>
                        {pair.dragon && (
                          <>
                            <div className="text-xs text-game-accent/70 mt-1">Дракон</div>
                            <div className="text-xs font-medium text-secondary">{pair.dragon.name}</div>
                          </>
                        )}
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div>💪 {pair.power}</div>
                          <div>🛡️ {pair.defense}</div>
                          <div>❤️ {pair.health}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <div className="text-xs">Пара {index + 1}</div>
                        <div className="text-xs mt-1">Не выбрана</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};