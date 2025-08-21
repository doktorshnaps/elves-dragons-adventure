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
import { Shield, Swords, Clock, Star } from 'lucide-react';

interface BarracksUpgrade {
  id: string;
  heroId: string;
  startTime: number;
  endTime: number;
  fromRarity: number;
  toRarity: number;
}

interface BarracksProps {
  barracksLevel: number;
  onUpgradeBuilding: () => void;
}

export const Barracks: React.FC<BarracksProps> = ({ barracksLevel, onUpgradeBuilding }) => {
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const [activeUpgrades, setActiveUpgrades] = useState<BarracksUpgrade[]>([]);
  const [selectedHeroes, setSelectedHeroes] = useState<CardType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved upgrades from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('barracksUpgrades');
    if (saved) {
      try {
        const upgrades = JSON.parse(saved);
        setActiveUpgrades(upgrades.filter((u: BarracksUpgrade) => u.endTime > Date.now()));
      } catch (error) {
        console.error('Error loading barracks upgrades:', error);
      }
    }
  }, []);

  // Save upgrades to localStorage
  useEffect(() => {
    localStorage.setItem('barracksUpgrades', JSON.stringify(activeUpgrades));
  }, [activeUpgrades]);

  // Check for completed upgrades - no auto-completion, player must claim manually
  useEffect(() => {
    const completedUpgrades = activeUpgrades.filter(upgrade => upgrade.endTime <= currentTime);
    
    if (completedUpgrades.length > 0) {
      // Don't auto-complete, just let the UI show the "Claim" button
    }
  }, [currentTime, activeUpgrades]);

  const completeUpgrade = async (upgrade: BarracksUpgrade) => {
    const currentCards = gameData.cards as CardType[] || [];
    const heroToUpgrade = currentCards.find(c => c.id === upgrade.heroId);
    
    if (!heroToUpgrade) return;

    // Create upgraded hero
    const upgradedHero: CardType = {
      ...heroToUpgrade,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      rarity: upgrade.toRarity as any,
      power: Math.floor(heroToUpgrade.power * Math.pow(1.8, upgrade.toRarity - heroToUpgrade.rarity)),
      defense: Math.floor(heroToUpgrade.defense * Math.pow(1.8, upgrade.toRarity - heroToUpgrade.rarity)),
      health: Math.floor(heroToUpgrade.health * Math.pow(1.8, upgrade.toRarity - heroToUpgrade.rarity)),
      magic: Math.floor(heroToUpgrade.magic * Math.pow(1.8, upgrade.toRarity - heroToUpgrade.rarity))
    };

    // Remove old hero and add upgraded one
    const newCards = currentCards.filter(c => c.id !== upgrade.heroId).concat(upgradedHero);
    
    await updateGameData({ cards: newCards });
    
    // Remove completed upgrade
    setActiveUpgrades(prev => prev.filter(u => u.id !== upgrade.id));
    
    toast({
      title: 'Улучшение завершено!',
      description: `${heroToUpgrade.name} улучшен до ${upgrade.toRarity} ранга!`,
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

  const startUpgrade = (heroes: CardType[]) => {
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
      toRarity: hero1.rarity + 1
    };

    // Remove the two used heroes from cards
    const currentCards = gameData.cards as CardType[] || [];
    const newCards = currentCards.filter(c => c.id !== hero1.id && c.id !== hero2.id);
    
    updateGameData({ cards: newCards });
    setActiveUpgrades(prev => [...prev, newUpgrade]);

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
                
                return (
                  <div key={upgrade.id} className="p-4 border border-orange-500/20 rounded-lg">
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
                return (
                  <div key={key} className="p-4 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{hero.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {hero.faction} • Ранг {hero.rarity} → {hero.rarity + 1}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Доступно: {heroes.length} карт
                        </p>
                      </div>
                      <Button
                        onClick={() => startUpgrade(heroes)}
                        disabled={!canStartUpgrade() || heroes.length < 2}
                        size="sm"
                      >
                        Улучшить ({getUpgradeTime(hero.rarity) / 1000}с)
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {heroes.slice(0, 6).map(heroCard => (
                        <div key={heroCard.id} className="relative">
                          <CardDisplay 
                            card={heroCard} 
                            showSellButton={false} 
                            className="w-20 h-32 text-xs"
                          />
                        </div>
                      ))}
                      {heroes.length > 6 && (
                        <div className="flex items-center justify-center w-20 h-32 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                          +{heroes.length - 6}
                        </div>
                      )}
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