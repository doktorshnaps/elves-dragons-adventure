import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { Card as CardType } from '@/types/cards';
import { upgradeCard } from '@/utils/cardUtils';
import { CardDisplay } from '../CardDisplay';

import { initializeCardHealth } from '@/utils/cardHealthUtils';
import { Shield, Swords, Clock, Star, ArrowRight } from 'lucide-react';

interface BarracksUpgrade {
  id: string;
  heroId: string;
  startTime: number;
  endTime: number;
  fromRarity: number;
  toRarity: number;
  baseCard?: CardType;
}

interface BarracksProps {
  barracksLevel: number;
  onUpgradeBuilding: () => void;
}

export const Barracks: React.FC<BarracksProps> = ({ barracksLevel, onUpgradeBuilding }) => {
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const [selectedHeroes, setSelectedHeroes] = useState<CardType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Initialize cards without passive regeneration
  const initializedCards = (gameData.cards as CardType[] || []).map(initializeCardHealth);

  // Get active upgrades from Supabase data
  const activeUpgrades = (gameData.barracksUpgrades || []) as BarracksUpgrade[];

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const completeUpgrade = async (upgrade: BarracksUpgrade) => {
    const currentCards = (gameData.cards as CardType[]) || [];
    let sourceHero = (upgrade as any).baseCard || currentCards.find(c => c.id === upgrade.heroId);

    // Fallback for legacy upgrades without snapshot
    if (!sourceHero) {
      sourceHero = {
        id: upgrade.heroId,
        name: 'Неизвестный герой',
        type: 'character',
        power: 100,
        defense: 100,
        health: 100,
        magic: 100,
        rarity: upgrade.fromRarity as any,
      } as CardType;
    }

    // Create upgraded hero from the source snapshot
    const upgradedHero: CardType = {
      ...sourceHero,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      rarity: upgrade.toRarity as any,
      power: Math.floor(sourceHero.power * Math.pow(1.8, upgrade.toRarity - (sourceHero.rarity as number))),
      defense: Math.floor(sourceHero.defense * Math.pow(1.8, upgrade.toRarity - (sourceHero.rarity as number))),
      health: Math.floor(sourceHero.health * Math.pow(1.8, upgrade.toRarity - (sourceHero.rarity as number))),
      magic: Math.floor(sourceHero.magic * Math.pow(1.8, upgrade.toRarity - (sourceHero.rarity as number)))
    };

    // Remove old hero (if exists) and add upgraded one
    const newCards = currentCards.filter(c => c.id !== upgrade.heroId).concat(upgradedHero);

    // Remove completed upgrade from Supabase
    const updatedUpgrades = activeUpgrades.filter(u => u.id !== upgrade.id);

    await updateGameData({
      cards: newCards,
      barracksUpgrades: updatedUpgrades
    });

    toast({
      title: 'Улучшение завершено!',
      description: `${sourceHero.name} улучшен до ${upgrade.toRarity} ранга!`,
    });

    // Dispatch event to update cards in other components
    const cardsEvent = new CustomEvent('cardsUpdate', {
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);
  };

  const getAvailableHeroes = (): CardType[] => {
    const currentCards = gameData.cards as CardType[] || [];
    return currentCards.filter(card => 
      card.type === 'character' && 
      !activeUpgrades.some(upgrade => upgrade.heroId === card.id)
    );
  };

  const getUpgradeableHeroes = (): { [key: string]: CardType[] } => {
    const heroes = getAvailableHeroes();
    const grouped: { [key: string]: CardType[] } = {};
    
    heroes.forEach(hero => {
      const key = `${hero.name}|${hero.rarity}|${hero.faction}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(hero);
    });

    // Filter groups that have at least 2 heroes and can be upgraded at current barracks level
    const filtered: { [key: string]: CardType[] } = {};
    Object.entries(grouped).forEach(([key, heroList]) => {
      const hero = heroList[0];
      const canUpgradeRarity = hero.rarity <= barracksLevel && hero.rarity < 8;
      if (heroList.length >= 2 && canUpgradeRarity) {
        filtered[key] = heroList;
      }
    });

    return filtered;
  };

  const getMaxConcurrentUpgrades = (): number => {
    return barracksLevel;
  };

  const getUpgradeTime = (fromRarity: number): number => {
    // Upgrade time in milliseconds: 30 seconds * rarity for testing (in real game would be hours)
    return 30000 * fromRarity;
  };

  const canStartUpgrade = (): boolean => {
    return activeUpgrades.length < getMaxConcurrentUpgrades();
  };

  const startUpgrade = async (heroes: CardType[]) => {
    if (!canStartUpgrade()) {
      toast({
        title: 'Недостаточно места',
        description: `Казарма уровня ${barracksLevel} может улучшать только ${getMaxConcurrentUpgrades()} героев одновременно`,
        variant: 'destructive'
      });
      return;
    }

    if (heroes.length < 2) {
      toast({
        title: 'Недостаточно героев',
        description: 'Нужно 2 одинаковых героя для улучшения',
        variant: 'destructive'
      });
      return;
    }

    const hero1 = heroes[0];
    const hero2 = heroes[1];
    
    if (hero1.rarity > barracksLevel) {
      toast({
        title: 'Недостаточный уровень казармы',
        description: `Для улучшения героев ${hero1.rarity} ранга нужна казарма уровня ${hero1.rarity}`,
        variant: 'destructive'
      });
      return;
    }

    const upgradeTime = getUpgradeTime(hero1.rarity);
    const startTime = Date.now();
    const endTime = startTime + upgradeTime;

    const newUpgrade: BarracksUpgrade = {
      id: `${hero1.id}_${startTime}`,
      heroId: hero1.id,
      startTime,
      endTime,
      fromRarity: hero1.rarity,
      toRarity: hero1.rarity + 1,
      baseCard: hero1
    };

    // Remove the two used heroes from cards
    const currentCards = gameData.cards as CardType[] || [];
    const newCards = currentCards.filter(c => c.id !== hero1.id && c.id !== hero2.id);
    
    // Add new upgrade to Supabase
    const updatedUpgrades = [...activeUpgrades, newUpgrade];
    
    await updateGameData({ 
      cards: newCards,
      barracksUpgrades: updatedUpgrades
    });

    toast({
      title: 'Улучшение начато!',
      description: `${hero1.name} будет улучшен через ${Math.ceil(upgradeTime / 1000)} секунд`,
    });

    // Dispatch event to update cards in other components
    const cardsEvent = new CustomEvent('cardsUpdate', {
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);
  };

  const formatTimeRemaining = (endTime: number): string => {
    const remaining = Math.max(0, endTime - currentTime);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  };

  const upgradeableGroups = getUpgradeableHeroes();

  return (
    <div className="space-y-6">
      {/* Barracks Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Казарма</CardTitle>
            </div>
            <Badge variant="secondary">
              Уровень {barracksLevel}/8
            </Badge>
          </div>
          <CardDescription>
            Улучшение героев. Макс. одновременных улучшений: {getMaxConcurrentUpgrades()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• На уровне {barracksLevel} можно улучшать героев до {barracksLevel + 1} ранга</p>
              <p>• Активных улучшений: {activeUpgrades.length}/{getMaxConcurrentUpgrades()}</p>
            </div>
            
            {barracksLevel < 8 && (
              <Button onClick={onUpgradeBuilding} variant="outline">
                Улучшить казарму
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Upgrades */}
      {activeUpgrades.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Улучшения в процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeUpgrades.map(upgrade => {
                 const progress = Math.min(100, ((currentTime - upgrade.startTime) / (upgrade.endTime - upgrade.startTime)) * 100);
                 const remaining = formatTimeRemaining(upgrade.endTime);
                 const isCompleted = upgrade.endTime <= currentTime;
                 const baseCard = (upgrade as any).baseCard;
                 
                 return (
                   <div key={upgrade.id} className="p-4 border border-orange-500/20 rounded-lg">
                     <div className="flex items-start gap-4 mb-4">
                       {/* Current Card Preview */}
                       {baseCard && (
                         <div className="flex-shrink-0">
                           <div className="text-xs text-muted-foreground mb-1">Улучшается:</div>
                           <CardDisplay 
                             card={baseCard}
                             showSellButton={false}
                             className="w-16 h-24 text-xs"
                           />
                         </div>
                       )}
                       
                       {/* Arrow */}
                       <div className="flex-shrink-0 flex items-center mt-6">
                         <ArrowRight className="w-4 h-4 text-muted-foreground" />
                       </div>
                       
                       {/* Result Card Preview */}
                       {baseCard && (
                         <div className="flex-shrink-0">
                           <div className="text-xs text-muted-foreground mb-1">Результат:</div>
                           <CardDisplay 
                             card={{
                               ...baseCard,
                               rarity: upgrade.toRarity as any,
                               power: Math.floor(baseCard.power * Math.pow(1.8, upgrade.toRarity - (baseCard.rarity as number))),
                               defense: Math.floor(baseCard.defense * Math.pow(1.8, upgrade.toRarity - (baseCard.rarity as number))),
                               health: Math.floor(baseCard.health * Math.pow(1.8, upgrade.toRarity - (baseCard.rarity as number))),
                               magic: Math.floor(baseCard.magic * Math.pow(1.8, upgrade.toRarity - (baseCard.rarity as number)))
                             }}
                             showSellButton={false}
                             className="w-16 h-24 text-xs"
                           />
                         </div>
                       )}
                       
                       {/* Upgrade Info */}
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                             <Star className="w-4 h-4 text-orange-500" />
                             <span className="font-medium">
                               Улучшение {upgrade.fromRarity} → {upgrade.toRarity} ранг
                             </span>
                           </div>
                           <div className="flex items-center gap-2">
                             {isCompleted ? (
                               <Button 
                                 onClick={() => completeUpgrade(upgrade)}
                                 size="sm"
                                 className="bg-green-600 hover:bg-green-700"
                               >
                                 Забрать
                               </Button>
                             ) : (
                               <span className="text-sm text-muted-foreground">{remaining}</span>
                             )}
                           </div>
                         </div>
                         {!isCompleted && <Progress value={progress} className="h-2" />}
                       </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Heroes for Upgrade */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Доступные герои для улучшения
          </CardTitle>
          <CardDescription>
            Выберите двух одинаковых героев для улучшения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(upgradeableGroups).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Нет доступных героев для улучшения</p>
              <p className="text-sm mt-2">
                Нужно два одинаковых героя {barracksLevel} ранга или ниже
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(upgradeableGroups).map(([key, heroes]) => {
                 const hero = heroes[0];
                 const previewUpgraded = {
                   ...hero,
                   rarity: (hero.rarity + 1) as any,
                   power: Math.floor(hero.power * 1.8),
                   defense: Math.floor(hero.defense * 1.8),
                   health: Math.floor(hero.health * 1.8),
                   magic: Math.floor(hero.magic * 1.8)
                 };
                 
                 return (
                   <div key={key} className="p-4 border border-primary/20 rounded-lg">
                     <div className="flex items-start gap-4 mb-4">
                       {/* Current Heroes Preview */}
                       <div className="flex-shrink-0">
                         <div className="text-xs text-muted-foreground mb-2">
                           Требуется: 2 карты (доступно: {heroes.length})
                         </div>
                         <div className="flex gap-1">
                           <CardDisplay 
                             card={hero}
                             showSellButton={false}
                             className="w-16 h-24 text-xs"
                           />
                           <div className="w-16 h-24 border border-dashed border-primary/40 rounded flex items-center justify-center text-xs text-muted-foreground">
                             +1
                           </div>
                         </div>
                       </div>
                       
                       {/* Arrow */}
                       <div className="flex-shrink-0 flex items-center mt-8">
                         <ArrowRight className="w-5 h-5 text-primary" />
                       </div>
                       
                       {/* Result Preview */}
                       <div className="flex-shrink-0">
                         <div className="text-xs text-muted-foreground mb-2">Результат:</div>
                         <CardDisplay 
                           card={previewUpgraded}
                           showSellButton={false}
                           className="w-16 h-24 text-xs"
                         />
                       </div>
                       
                       {/* Hero Info and Action */}
                       <div className="flex-1">
                         <div className="flex items-center justify-between">
                           <div>
                             <h4 className="font-medium">{hero.name}</h4>
                             <p className="text-sm text-muted-foreground">
                               {hero.faction} • Ранг {hero.rarity} → {hero.rarity + 1}
                             </p>
                             <div className="text-xs text-muted-foreground mt-1 space-y-1">
                               <div>⚔️ {hero.power} → {previewUpgraded.power}</div>
                               <div>🛡️ {hero.defense} → {previewUpgraded.defense}</div>
                               <div>❤️ {hero.health} → {previewUpgraded.health}</div>
                               <div>✨ {hero.magic} → {previewUpgraded.magic}</div>
                             </div>
                           </div>
                           <Button
                             onClick={() => startUpgrade(heroes)}
                             disabled={!canStartUpgrade() || heroes.length < 2}
                             size="sm"
                           >
                             Улучшить ({getUpgradeTime(hero.rarity) / 1000}с)
                           </Button>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};