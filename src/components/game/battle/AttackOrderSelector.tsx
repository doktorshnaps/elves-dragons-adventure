import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamPair } from '@/types/teamBattle';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { getTranslatedCardName } from '@/utils/cardNameTranslations';
import { CardImage } from '@/components/game/cards/CardImage';
import { DungeonType } from '@/constants/dungeons';
import { getElementEmoji, getElementName, useFactionElements } from '@/hooks/useFactionElements';
import { useDungeonSettings } from '@/hooks/useDungeonSettings';
import { Shield, Swords, AlertTriangle, CheckCircle } from 'lucide-react';

// Dungeon element mapping (same as DungeonSearchDialog)
const dungeonElementMap: Record<string, string> = {
  spider_nest: 'nature',
  bone_dungeon: 'earth',
  dark_mage: 'darkness',
  forgotten_souls: 'darkness',
  ice_throne: 'ice',
  sea_serpent: 'water',
  dragon_lair: 'fire',
  pantheon_gods: 'light'
};

interface AttackOrderSelectorProps {
  playerPairs: TeamPair[];
  attackOrder: string[];
  onOrderChange: (newOrder: string[]) => void;
  onStartBattle: () => void;
  dungeonType?: DungeonType;
}

const DungeonInfoPanel: React.FC<{ dungeonType: DungeonType; playerPairs: TeamPair[] }> = ({ dungeonType, playerPairs }) => {
  const { language } = useLanguage();
  const { factionElements, getElementByType } = useFactionElements();
  const { getDungeonByType } = useDungeonSettings();
  
  const dungeonSettings = getDungeonByType(dungeonType);
  const dungeonElement = dungeonElementMap[dungeonType] || 'neutral';
  const elementEmoji = getElementEmoji(dungeonElement);
  const elementName = getElementName(dungeonElement);
  
  // Find which element is strong against this dungeon's element
  const strongAgainstDungeon = factionElements.find(fe => fe.strong_against === dungeonElement);
  // Find which element is weak against this dungeon's element  
  const weakAgainstDungeon = factionElements.find(fe => fe.weak_against === dungeonElement);
  
  // Analyze player team factions
  const teamFactions = playerPairs
    .filter(p => p.hero?.faction)
    .map(p => p.hero.faction as string);
  
  const teamAnalysis = teamFactions.map(faction => {
    const fe = factionElements.find(f => f.faction_name === faction);
    if (!fe) return null;
    
    if (fe.strong_against === dungeonElement) {
      return { faction, type: 'bonus' as const, emoji: fe.element_emoji, element: fe.element_type };
    }
    if (fe.weak_against === dungeonElement) {
      return { faction, type: 'penalty' as const, emoji: fe.element_emoji, element: fe.element_type };
    }
    return { faction, type: 'neutral' as const, emoji: fe.element_emoji, element: fe.element_type };
  }).filter(Boolean);

  const hasBonus = teamAnalysis.some(a => a?.type === 'bonus');
  const hasPenalty = teamAnalysis.some(a => a?.type === 'penalty');

  return (
    <div className="bg-black/40 border border-white/20 rounded-xl p-3 sm:p-4 mb-3 backdrop-blur-sm">
      {/* Dungeon Element Info */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-2xl">{elementEmoji}</span>
        <div className="text-center">
          <div className="text-sm sm:text-base font-bold text-white">
            {language === 'ru' ? 'Стихия подземелья' : 'Dungeon Element'}: {elementName}
          </div>
        </div>
        <span className="text-2xl">{elementEmoji}</span>
      </div>
      
      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
        {strongAgainstDungeon && (
          <div className="flex items-start gap-2 bg-green-900/30 border border-green-500/30 rounded-lg p-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-green-400 font-medium">
                {language === 'ru' ? 'Рекомендовано' : 'Recommended'}:
              </span>
              <div className="text-green-300/90">
                {strongAgainstDungeon.element_emoji} {strongAgainstDungeon.faction_name} ({getElementName(strongAgainstDungeon.element_type)})
                <span className="text-green-400"> +{Math.round(Number(strongAgainstDungeon.damage_bonus) * 100)}% {language === 'ru' ? 'урона' : 'damage'}</span>
              </div>
            </div>
          </div>
        )}
        
        {weakAgainstDungeon && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-red-400 font-medium">
                {language === 'ru' ? 'Не рекомендовано' : 'Not recommended'}:
              </span>
              <div className="text-red-300/90">
                {weakAgainstDungeon.element_emoji} {weakAgainstDungeon.faction_name} ({getElementName(weakAgainstDungeon.element_type)})
                <span className="text-red-400"> -{Math.round(Number(weakAgainstDungeon.damage_penalty) * 100)}% {language === 'ru' ? 'урона' : 'damage'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Analysis */}
      {teamAnalysis.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-xs text-white/60 mb-1">
            {language === 'ru' ? 'Анализ вашей команды' : 'Your team analysis'}:
          </div>
          <div className="flex flex-wrap gap-1">
            {teamAnalysis.map((a, i) => (
              <span 
                key={i} 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  a?.type === 'bonus' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : a?.type === 'penalty'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/10 text-white/60 border border-white/20'
                }`}
              >
                {a?.emoji} {a?.faction}
                {a?.type === 'bonus' && ' ✓'}
                {a?.type === 'penalty' && ' ✗'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AttackOrderSelector: React.FC<AttackOrderSelectorProps> = ({
  playerPairs,
  attackOrder,
  onOrderChange,
  onStartBattle,
  dungeonType
}) => {
  const {
    language
  } = useLanguage();
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
  return <div className="min-h-screen flex flex-col justify-end">
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 my-[107px] mx-[3px] px-0 py-0 pr-0 pb-0 mb-0">
        <div className="max-w-2xl w-full space-y-3">
          {/* Dungeon Info Panel */}
          {dungeonType && <DungeonInfoPanel dungeonType={dungeonType} playerPairs={playerPairs} />}
          
          <Card variant="menu" className="w-full" style={{
            boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
          }}>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-center text-lg sm:text-2xl text-white">
                {t(language, 'attackOrder.readyTitle')}
              </CardTitle>
              <p className="text-center text-sm sm:text-base text-gray-300">
                {t(language, 'attackOrder.readyMessage')}
              </p>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-6">
              <div className="flex justify-center">
                <Button onClick={onStartBattle} variant="menu" className="px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg" disabled={playerPairs.length === 0} style={{
                boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
              }}>
                  {t(language, 'attackOrder.startBattle')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Team Selection Panel at Bottom */}
      <div className="bg-black/50 border-t-2 border-white p-1.5 sm:p-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xs sm:text-lg font-bold text-white mb-1.5 sm:mb-2 text-center">
            {t(language, 'attackOrder.selectedTeam')} ({playerPairs.length}/5)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2">
            {Array.from({
            length: 5
          }, (_, index) => {
            const pair = playerPairs[index];
            return <div key={index} className="relative overflow-hidden border border-white rounded-xl p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm" style={{
              boxShadow: '-20px 10px 8px rgba(0, 0, 0, 0.6)'
            }}>
                  {pair ? <>
                      {/* Mobile horizontal layout */}
                      <div className="block sm:hidden">
                        <div className="text-[10px] text-white font-medium text-center mb-0.5">{t(language, 'attackOrder.pair')} {index + 1}</div>
                        <div className="flex gap-1.5">
                          {/* Hero section */}
                          <div className="flex-1 flex gap-1">
                            <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-white/30 bg-black/30">
                              <CardImage image={pair.hero.image} name={pair.hero.name} card={pair.hero} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] text-white/70">{t(language, 'attackOrder.hero')}</div>
                              <div className="text-[10px] font-medium text-white truncate">{getTranslatedCardName(pair.hero.name, language)}</div>
                            </div>
                          </div>
                          
                          {/* Dragon section */}
                          {pair.dragon && <div className="flex-1 flex gap-1">
                              <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-white/30 bg-black/30">
                                <CardImage image={pair.dragon.image} name={pair.dragon.name} card={pair.dragon} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[9px] text-white/70">{t(language, 'attackOrder.dragon')}</div>
                                <div className="text-[10px] font-medium text-white truncate">{getTranslatedCardName(pair.dragon.name, language)}</div>
                              </div>
                            </div>}
                        </div>
                        
                        {/* Stats horizontal */}
                        <div className="flex justify-around text-[10px] text-gray-300 mt-1 pt-1 border-t border-white/20">
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
                            <CardImage image={pair.hero.image} name={pair.hero.name} card={pair.hero} />
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-white/70">{t(language, 'attackOrder.hero')}</div>
                          <div className="text-xs font-medium text-white">{getTranslatedCardName(pair.hero.name, language)}</div>
                          
                          {pair.dragon && <>
                              <div className="flex justify-center mt-1">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/30 bg-black/30">
                                  <CardImage image={pair.dragon.image} name={pair.dragon.name} card={pair.dragon} />
                                </div>
                              </div>
                              <div className="text-xs text-white/70 mt-1">{t(language, 'attackOrder.dragon')}</div>
                              <div className="text-xs font-medium text-white">{getTranslatedCardName(pair.dragon.name, language)}</div>
                            </>}
                          
                          <div className="text-xs text-gray-300 mt-2 space-y-1">
                            <div>💪 {pair.power}</div>
                            <div>🛡️ {pair.defense}</div>
                            <div>❤️ {pair.health}</div>
                          </div>
                        </div>
                      </div>
                    </> : <div className="flex items-center justify-center min-h-[50px] sm:min-h-[200px] text-gray-300">
                      <div className="text-center">
                        <div className="text-[10px]">{t(language, 'attackOrder.pair')} {index + 1}</div>
                        <div className="text-[10px] mt-0.5">{t(language, 'attackOrder.notSelected')}</div>
                      </div>
                    </div>}
                </div>;
          })}
          </div>
        </div>
      </div>
    </div>;
};
