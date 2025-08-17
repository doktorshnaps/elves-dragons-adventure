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
    <div className="min-h-screen flex flex-col justify-end">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Готовность к бою
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Ваша команда готова к сражению
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button 
                onClick={onStartBattle}
                className="px-8 py-3 text-lg"
                disabled={playerPairs.length === 0}
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
                <div key={index} className="relative overflow-hidden border border-game-accent/30 rounded-lg p-3 min-h-[200px] bg-card/30">
                  {pair ? (
                    <div className="space-y-2">
                      <div className="text-xs text-game-accent font-medium text-center">Пара {index + 1}</div>
                      
                      {/* Hero Image */}
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-primary/30 bg-primary/10">
                          {pair.hero.image ? (
                            <img 
                              src={pair.hero.image} 
                              alt={pair.hero.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary">
                              <span className="text-xl">⚔️</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-game-accent/70">Герой</div>
                        <div className="text-xs font-medium text-primary">{pair.hero.name}</div>
                        
                        {pair.dragon && (
                          <>
                            <div className="flex justify-center mt-1">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-secondary/30 bg-secondary/10">
                                {pair.dragon.image ? (
                                  <img 
                                    src={pair.dragon.image} 
                                    alt={pair.dragon.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-secondary">
                                    <span className="text-sm">🐲</span>
                                  </div>
                                )}
                              </div>
                            </div>
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