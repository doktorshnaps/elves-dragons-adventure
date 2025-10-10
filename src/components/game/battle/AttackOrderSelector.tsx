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
        <Card variant="menu" className="max-w-2xl w-full" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-white">
              Готовность к бою
            </CardTitle>
            <p className="text-center text-gray-300">
              Ваша команда готова к сражению
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button 
                onClick={onStartBattle}
                variant="menu"
                className="px-8 py-3 text-lg"
                disabled={playerPairs.length === 0}
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
              >
                Начать бой
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Selection Panel at Bottom */}
      <div className="bg-black/50 border-t-2 border-white p-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-lg font-bold text-white mb-3 text-center">
            Выбранная команда ({playerPairs.length}/5)
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, index) => {
              const pair = playerPairs[index];
              return (
                <div key={index} className="relative overflow-hidden border-2 border-white rounded-3xl p-3 min-h-[200px] bg-black/30 backdrop-blur-sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                  {pair ? (
                    <div className="space-y-2">
                      <div className="text-xs text-white font-medium text-center">Пара {index + 1}</div>
                      
                      {/* Hero Image */}
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                          {pair.hero.image ? (
                            <img 
                              src={pair.hero.image} 
                              alt={pair.hero.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                              <span className="text-xl">⚔️</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-white/70">Герой</div>
                        <div className="text-xs font-medium text-white">{pair.hero.name}</div>
                        
                        {pair.dragon && (
                          <>
                            <div className="flex justify-center mt-1">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                                {pair.dragon.image ? (
                                  <img 
                                    src={pair.dragon.image} 
                                    alt={pair.dragon.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white">
                                    <span className="text-sm">🐲</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-white/70 mt-1">Дракон</div>
                            <div className="text-xs font-medium text-white">{pair.dragon.name}</div>
                          </>
                        )}
                        
                        <div className="text-xs text-gray-300 mt-2 space-y-1">
                          <div>💪 {pair.power}</div>
                          <div>🛡️ {pair.defense}</div>
                          <div>❤️ {pair.health}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
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