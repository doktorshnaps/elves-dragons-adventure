import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamPair } from '@/types/teamBattle';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { getTranslatedCardName } from '@/utils/cardNameTranslations';
import { CardImage } from '@/components/game/cards/CardImage';

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
  const { language } = useLanguage();
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
              {t(language, 'attackOrder.readyTitle')}
            </CardTitle>
            <p className="text-center text-gray-300">
              {t(language, 'attackOrder.readyMessage')}
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
                {t(language, 'attackOrder.startBattle')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Selection Panel at Bottom */}
      <div className="bg-black/50 border-t-2 border-white p-2 sm:p-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-sm sm:text-lg font-bold text-white mb-2 text-center">
            {t(language, 'attackOrder.selectedTeam')} ({playerPairs.length}/5)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, index) => {
              const pair = playerPairs[index];
              return (
                <div key={index} className="relative overflow-hidden border-2 border-white rounded-2xl p-2 bg-black/30 backdrop-blur-sm" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                  {pair ? (
                    <>
                      {/* Mobile horizontal layout */}
                      <div className="block sm:hidden">
                        <div className="text-xs text-white font-medium text-center mb-1">{t(language, 'attackOrder.pair')} {index + 1}</div>
                        <div className="flex gap-2">
                          {/* Hero section */}
                          <div className="flex-1 flex gap-1.5">
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                              <CardImage 
                                image={pair.hero.image} 
                                name={pair.hero.name}
                                card={pair.hero}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white/70">{t(language, 'attackOrder.hero')}</div>
                              <div className="text-xs font-medium text-white truncate">{getTranslatedCardName(pair.hero.name, language)}</div>
                            </div>
                          </div>
                          
                          {/* Dragon section */}
                          {pair.dragon && (
                            <div className="flex-1 flex gap-1.5">
                              <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                                <CardImage 
                                  image={pair.dragon.image} 
                                  name={pair.dragon.name}
                                  card={pair.dragon}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-white/70">{t(language, 'attackOrder.dragon')}</div>
                                <div className="text-xs font-medium text-white truncate">{getTranslatedCardName(pair.dragon.name, language)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Stats horizontal */}
                        <div className="flex justify-around text-xs text-gray-300 mt-1.5 pt-1.5 border-t border-white/20">
                          <div>💪 {pair.power}</div>
                          <div>🛡️ {pair.defense}</div>
                          <div>❤️ {pair.health}</div>
                        </div>
                      </div>

                      {/* Desktop vertical layout */}
                      <div className="hidden sm:block space-y-2">
                        <div className="text-xs text-white font-medium text-center">{t(language, 'attackOrder.pair')} {index + 1}</div>
                        
                        {/* Hero Image */}
                        <div className="flex justify-center">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                            <CardImage 
                              image={pair.hero.image} 
                              name={pair.hero.name}
                              card={pair.hero}
                            />
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-white/70">{t(language, 'attackOrder.hero')}</div>
                          <div className="text-xs font-medium text-white">{getTranslatedCardName(pair.hero.name, language)}</div>
                          
                          {pair.dragon && (
                            <>
                              <div className="flex justify-center mt-1">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                                  <CardImage 
                                    image={pair.dragon.image} 
                                    name={pair.dragon.name}
                                    card={pair.dragon}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-white/70 mt-1">{t(language, 'attackOrder.dragon')}</div>
                              <div className="text-xs font-medium text-white">{getTranslatedCardName(pair.dragon.name, language)}</div>
                            </>
                          )}
                          
                          <div className="text-xs text-gray-300 mt-2 space-y-1">
                            <div>💪 {pair.power}</div>
                            <div>🛡️ {pair.defense}</div>
                            <div>❤️ {pair.health}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center min-h-[60px] sm:min-h-[200px] text-gray-300">
                      <div className="text-center">
                        <div className="text-xs">{t(language, 'attackOrder.pair')} {index + 1}</div>
                        <div className="text-xs mt-0.5">{t(language, 'attackOrder.notSelected')}</div>
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