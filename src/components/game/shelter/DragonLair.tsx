import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { Card as CardType } from '@/types/cards';
import { CardDisplay } from '../CardDisplay';
import { Flame, Clock, Star } from 'lucide-react';

interface DragonUpgrade {
  id: string;
  dragonId: string;
  startTime: number;
  endTime: number;
  fromRarity: number;
  toRarity: number;
  baseCard?: CardType;
}

interface DragonLairProps {
  lairLevel: number;
  onUpgradeBuilding: () => void;
}

export const DragonLair: React.FC<DragonLairProps> = ({ lairLevel, onUpgradeBuilding }) => {
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Get active upgrades from Supabase data
  const activeUpgrades = (gameData.dragonLairUpgrades || []) as DragonUpgrade[];

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const claimUpgrade = async (upgrade: DragonUpgrade) => {
    const currentCards = (gameData.cards as CardType[]) || [];
    let sourceDragon = (upgrade as any).baseCard || currentCards.find(c => c.id === upgrade.dragonId);

    // Fallback for legacy upgrades without snapshot
    if (!sourceDragon) {
      sourceDragon = {
        id: upgrade.dragonId,
        name: 'Неизвестный дракон',
        type: 'pet',
        power: 100,
        defense: 100,
        health: 100,
        magic: 100,
        rarity: upgrade.fromRarity as any,
      } as CardType;
    }

    // Create upgraded dragon from the source snapshot
    const upgradedDragon: CardType = {
      ...sourceDragon,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      rarity: upgrade.toRarity as any,
      power: Math.floor(sourceDragon.power * Math.pow(1.8, upgrade.toRarity - (sourceDragon.rarity as number))),
      defense: Math.floor(sourceDragon.defense * Math.pow(1.8, upgrade.toRarity - (sourceDragon.rarity as number))),
      health: Math.floor(sourceDragon.health * Math.pow(1.8, upgrade.toRarity - (sourceDragon.rarity as number))),
      magic: Math.floor(sourceDragon.magic * Math.pow(1.8, upgrade.toRarity - (sourceDragon.rarity as number)))
    };

    // Remove old dragon (if exists) and add upgraded one
    const newCards = currentCards.filter(c => c.id !== upgrade.dragonId).concat(upgradedDragon);

    // Remove completed upgrade from Supabase
    const updatedUpgrades = activeUpgrades.filter(u => u.id !== upgrade.id);

    await updateGameData({
      cards: newCards,
      dragonLairUpgrades: updatedUpgrades
    });

    toast({
      title: 'Улучшение завершено!',
      description: `${sourceDragon.name} улучшен до ${upgrade.toRarity} ранга!`,
    });

    // Dispatch event to update cards in other components
    const cardsEvent = new CustomEvent('cardsUpdate', {
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);
  };

  const getAvailableDragons = (): CardType[] => {
    const currentCards = gameData.cards as CardType[] || [];
    return currentCards.filter(card => 
      card.type === 'pet' && 
      !activeUpgrades.some(upgrade => upgrade.dragonId === card.id)
    );
  };

  const getUpgradeableDragons = (): { [key: string]: CardType[] } => {
    const dragons = getAvailableDragons();
    const grouped: { [key: string]: CardType[] } = {};
    
    dragons.forEach(dragon => {
      const key = `${dragon.name}|${dragon.rarity}|${dragon.faction}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(dragon);
    });

    // Filter groups that have at least 2 dragons and can be upgraded at current lair level
    const filtered: { [key: string]: CardType[] } = {};
    Object.entries(grouped).forEach(([key, dragonList]) => {
      const dragon = dragonList[0];
      const canUpgradeRarity = dragon.rarity <= lairLevel && dragon.rarity < 8;
      if (dragonList.length >= 2 && canUpgradeRarity) {
        filtered[key] = dragonList;
      }
    });

    return filtered;
  };

  const getMaxConcurrentUpgrades = (): number => {
    return lairLevel;
  };

  const getUpgradeTime = (fromRarity: number): number => {
    // Upgrade time in milliseconds: 30 seconds * rarity for testing (in real game would be hours)
    return 30000 * fromRarity;
  };

  const canStartUpgrade = (): boolean => {
    return activeUpgrades.length < getMaxConcurrentUpgrades();
  };

  const startUpgrade = async (dragons: CardType[]) => {
    if (!canStartUpgrade()) {
      toast({
        title: 'Недостаточно места',
        description: `Драконье логово уровня ${lairLevel} может улучшать только ${getMaxConcurrentUpgrades()} драконов одновременно`,
        variant: 'destructive'
      });
      return;
    }

    if (dragons.length < 2) {
      toast({
        title: 'Недостаточно драконов',
        description: 'Нужно 2 одинаковых дракона для улучшения',
        variant: 'destructive'
      });
      return;
    }

    const dragon1 = dragons[0];
    const dragon2 = dragons[1];
    
    if (dragon1.rarity > lairLevel) {
      toast({
        title: 'Недостаточный уровень логова',
        description: `Для улучшения драконов ${dragon1.rarity} ранга нужно логово уровня ${dragon1.rarity}`,
        variant: 'destructive'
      });
      return;
    }

    const upgradeTime = getUpgradeTime(dragon1.rarity);
    const startTime = Date.now();
    const endTime = startTime + upgradeTime;

    const newUpgrade: DragonUpgrade = {
      id: `${dragon1.id}_${startTime}`,
      dragonId: dragon1.id,
      startTime,
      endTime,
      fromRarity: dragon1.rarity,
      toRarity: dragon1.rarity + 1,
      baseCard: dragon1
    };

    // Remove the two used dragons from cards
    const currentCards = gameData.cards as CardType[] || [];
    const newCards = currentCards.filter(c => c.id !== dragon1.id && c.id !== dragon2.id);
    
    // Add new upgrade to Supabase
    const updatedUpgrades = [...activeUpgrades, newUpgrade];
    
    await updateGameData({ 
      cards: newCards,
      dragonLairUpgrades: updatedUpgrades
    });

    toast({
      title: 'Улучшение начато!',
      description: `${dragon1.name} будет улучшен через ${Math.ceil(upgradeTime / 1000)} секунд`,
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

  const upgradeableGroups = getUpgradeableDragons();

  return (
    <div className="space-y-6">
      {/* Dragon Lair Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <CardTitle className="text-2xl">Драконье Логово</CardTitle>
            </div>
            <Badge variant="secondary">
              Уровень {lairLevel}/8
            </Badge>
          </div>
          <CardDescription>
            Улучшение драконов. Макс. одновременных улучшений: {getMaxConcurrentUpgrades()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• На уровне {lairLevel} можно улучшать драконов до {lairLevel + 1} ранга</p>
              <p>• Активных улучшений: {activeUpgrades.length}/{getMaxConcurrentUpgrades()}</p>
            </div>
            
            {lairLevel < 8 && (
              <Button onClick={onUpgradeBuilding} variant="outline">
                Улучшить логово
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
                            onClick={() => claimUpgrade(upgrade)}
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

      {/* Available Dragons for Upgrade */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Доступные драконы для улучшения
          </CardTitle>
          <CardDescription>
            Выберите двух одинаковых драконов для улучшения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(upgradeableGroups).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Нет доступных драконов для улучшения</p>
              <p className="text-sm mt-2">
                Нужно два одинаковых дракона {lairLevel} ранга или ниже
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(upgradeableGroups).map(([key, dragons]) => {
                const dragon = dragons[0];
                return (
                  <div key={key} className="p-4 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{dragon.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dragon.faction} • Ранг {dragon.rarity} → {dragon.rarity + 1}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Доступно: {dragons.length} карт
                        </p>
                      </div>
                      <Button
                        onClick={() => startUpgrade(dragons)}
                        disabled={!canStartUpgrade() || dragons.length < 2}
                        size="sm"
                      >
                        Улучшить ({getUpgradeTime(dragon.rarity) / 1000}с)
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {dragons.slice(0, 6).map(dragonCard => (
                        <div key={dragonCard.id} className="relative">
                          <CardDisplay 
                            card={dragonCard} 
                            showSellButton={false} 
                            className="w-20 h-32 text-xs"
                          />
                        </div>
                      ))}
                      {dragons.length > 6 && (
                        <div className="flex items-center justify-center w-20 h-32 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                          +{dragons.length - 6}
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