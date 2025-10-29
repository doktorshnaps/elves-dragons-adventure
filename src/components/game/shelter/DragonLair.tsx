import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { Card as CardType } from '@/types/cards';
import { CardDisplay } from '../CardDisplay';
import { useItemInstances } from '@/hooks/useItemInstances';
import { initializeCardHealth } from '@/utils/cardHealthUtils';
import { Flame, Clock, Star, ArrowRight, Coins, Sparkles, AlertCircle } from 'lucide-react';
import { getUpgradeRequirement, rollUpgradeSuccess } from '@/utils/upgradeRequirements';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { instances: itemInstances, getCountsByItemId, removeItemInstancesByIds } = useItemInstances();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pendingUpgradeDragons, setPendingUpgradeDragons] = useState<CardType[]>([]);

  // Initialize cards without passive regeneration
  const initializedCards = (gameData.cards as CardType[] || []).map(initializeCardHealth);

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

  const checkUpgradeRequirements = (dragons: CardType[]): { canUpgrade: boolean; missingItems: string[] } => {
    if (dragons.length < 2) return { canUpgrade: false, missingItems: ['Недостаточно драконов'] };
    
    const dragon = dragons[0];
    const requirements = getUpgradeRequirement(dragon.rarity, 'dragonLair');
    
    if (!requirements) return { canUpgrade: false, missingItems: ['Нет данных об улучшении'] };
    
    const missingItems: string[] = [];
    const itemCounts = getCountsByItemId();
    
    // Check resources
    if (requirements.costs.balance && gameData.balance < requirements.costs.balance) {
      missingItems.push(`Монет: ${requirements.costs.balance - gameData.balance}`);
    }
    if (requirements.costs.wood && gameData.wood < requirements.costs.wood) {
      missingItems.push(`Дерева: ${requirements.costs.wood - gameData.wood}`);
    }
    if (requirements.costs.stone && gameData.stone < requirements.costs.stone) {
      missingItems.push(`Камня: ${requirements.costs.stone - gameData.stone}`);
    }
    if (requirements.costs.iron && gameData.iron < requirements.costs.iron) {
      missingItems.push(`Железа: ${requirements.costs.iron - gameData.iron}`);
    }
    if (requirements.costs.gold && (gameData.gold || 0) < requirements.costs.gold) {
      missingItems.push(`Золота: ${requirements.costs.gold - (gameData.gold || 0)}`);
    }
    
    // Check required items
    requirements.requiredItems.forEach(reqItem => {
      const available = itemCounts[reqItem.itemId] || 0;
      if (available < reqItem.quantity) {
        missingItems.push(`${reqItem.name}: ${reqItem.quantity - available}`);
      }
    });
    
    return { canUpgrade: missingItems.length === 0, missingItems };
  };

  const initiateDragonUpgrade = (dragons: CardType[]) => {
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

    const dragon = dragons[0];
    
    if (dragon.rarity > lairLevel) {
      toast({
        title: 'Недостаточный уровень логова',
        description: `Для улучшения драконов ${dragon.rarity} ранга нужно логово уровня ${dragon.rarity}`,
        variant: 'destructive'
      });
      return;
    }

    const { canUpgrade, missingItems } = checkUpgradeRequirements(dragons);
    
    if (!canUpgrade) {
      toast({
        title: 'Недостаточно ресурсов',
        description: `Не хватает: ${missingItems.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setPendingUpgradeDragons(dragons);
    setUpgradeDialogOpen(true);
  };

  const executeDragonUpgrade = async () => {
    const dragons = pendingUpgradeDragons;
    if (dragons.length < 2) return;

    const dragon1 = dragons[0];
    const dragon2 = dragons[1];
    const requirements = getUpgradeRequirement(dragon1.rarity, 'dragonLair');
    
    if (!requirements) return;

    // Roll for success
    const isSuccess = rollUpgradeSuccess(requirements.successChance);

    // Remove resources and items regardless of success
    const resourceUpdates: any = {};
    
    if (requirements.costs.balance) {
      resourceUpdates.balance = gameData.balance - requirements.costs.balance;
    }
    if (requirements.costs.wood) {
      resourceUpdates.wood = gameData.wood - requirements.costs.wood;
    }
    if (requirements.costs.stone) {
      resourceUpdates.stone = gameData.stone - requirements.costs.stone;
    }
    if (requirements.costs.iron) {
      resourceUpdates.iron = gameData.iron - requirements.costs.iron;
    }
    if (requirements.costs.gold) {
      resourceUpdates.gold = (gameData.gold || 0) - requirements.costs.gold;
    }

    // Remove required items
    const itemsToRemove: string[] = [];
    requirements.requiredItems.forEach(reqItem => {
      const availableInstances = itemInstances.filter(inst => 
        (inst.item_id === reqItem.itemId || inst.name === reqItem.name)
      ).slice(0, reqItem.quantity);
      itemsToRemove.push(...availableInstances.map(inst => inst.id));
    });

    if (itemsToRemove.length > 0) {
      await removeItemInstancesByIds(itemsToRemove);
    }

    if (isSuccess) {
      // Success: create upgraded dragon immediately
      const upgradedDragon: CardType = {
        ...dragon1,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        rarity: (dragon1.rarity + 1) as any,
        power: Math.floor(dragon1.power * 1.8),
        defense: Math.floor(dragon1.defense * 1.8),
        health: Math.floor(dragon1.health * 1.8),
        magic: Math.floor(dragon1.magic * 1.8)
      };

      // Remove both dragons and add upgraded one
      const currentCards = gameData.cards as CardType[] || [];
      const newCards = currentCards
        .filter(c => c.id !== dragon1.id && c.id !== dragon2.id)
        .concat(upgradedDragon);

      await updateGameData({
        ...resourceUpdates,
        cards: newCards
      });

      toast({
        title: '✨ Улучшение успешно!',
        description: `${dragon1.name} улучшен до ${dragon1.rarity + 1} ранга!`,
      });

      // Dispatch event to update cards
      const cardsEvent = new CustomEvent('cardsUpdate', {
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);
    } else {
      // Failure: dragons stay, but resources are consumed
      await updateGameData(resourceUpdates);

      toast({
        title: '❌ Улучшение не удалось',
        description: `Попытка улучшения провалилась. Драконы остались, но ресурсы потрачены.`,
        variant: 'destructive'
      });
    }

    setUpgradeDialogOpen(false);
    setPendingUpgradeDragons([]);
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
                 const baseCard = (upgrade as any).baseCard;
                 
                 return (
                    <div key={upgrade.id} className="p-2 sm:p-4 border border-orange-500/20 rounded-lg overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 mb-4">
                        {/* Current Card Preview */}
                        {baseCard && (
                          <div className="flex-shrink-0 w-full sm:w-auto">
                            <div className="text-xs text-muted-foreground mb-1">Улучшается:</div>
                            <div className="flex justify-center sm:block">
                              <CardDisplay 
                                card={baseCard}
                                showSellButton={false}
                                className="w-12 h-20 sm:w-16 sm:h-24 text-xs"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Arrow */}
                        <div className="flex-shrink-0 flex items-center justify-center w-full sm:w-auto sm:mt-6">
                          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 sm:rotate-0" />
                        </div>
                        
                        {/* Result Card Preview */}
                        {baseCard && (
                          <div className="flex-shrink-0 w-full sm:w-auto">
                            <div className="text-xs text-muted-foreground mb-1">Результат:</div>
                            <div className="flex justify-center sm:block">
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
                                className="w-12 h-20 sm:w-16 sm:h-24 text-xs"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Upgrade Info */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                              <span className="font-medium text-sm sm:text-base">
                                Улучшение {upgrade.fromRarity} → {upgrade.toRarity} ранг
                              </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              {isCompleted ? (
                                <Button 
                                  onClick={() => claimUpgrade(upgrade)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                >
                                  Забрать
                                </Button>
                              ) : (
                                <span className="text-xs sm:text-sm text-muted-foreground">{remaining}</span>
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

      {/* Available Dragons for Upgrade */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {t(language, 'shelter.availableDragons')}
          </CardTitle>
          <CardDescription>
            {t(language, 'shelter.selectTwoDragons')}
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
                  const previewUpgraded = {
                    ...dragon,
                    rarity: (dragon.rarity + 1) as any,
                    power: Math.floor(dragon.power * 1.8),
                    defense: Math.floor(dragon.defense * 1.8),
                    health: Math.floor(dragon.health * 1.8),
                    magic: Math.floor(dragon.magic * 1.8)
                  };
                  
                  const requirements = getUpgradeRequirement(dragon.rarity, 'dragonLair');
                  const { canUpgrade, missingItems } = checkUpgradeRequirements(dragons);
                  const itemCounts = getCountsByItemId();
                  
                  return (
                     <div key={key} className="p-2 sm:p-4 border border-primary/20 rounded-lg overflow-hidden">
                       <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 mb-4">
                        {/* Current Dragons Preview */}
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <div className="text-xs text-muted-foreground mb-2">
                            Требуется: 2 карты (доступно: {dragons.length})
                          </div>
                          <div className="flex gap-1 justify-center sm:justify-start">
                            <CardDisplay 
                              card={dragon}
                              showSellButton={false}
                              className="w-12 h-20 sm:w-16 sm:h-24 text-xs"
                            />
                            <div className="w-12 h-20 sm:w-16 sm:h-24 border border-dashed border-primary/40 rounded flex items-center justify-center text-xs text-muted-foreground">
                              +1
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <div className="flex-shrink-0 flex items-center justify-center w-full sm:w-auto sm:mt-8">
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary rotate-90 sm:rotate-0" />
                        </div>
                        
                        {/* Result Preview */}
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <div className="text-xs text-muted-foreground mb-2">Результат:</div>
                          <div className="flex justify-center sm:block">
                            <CardDisplay 
                              card={previewUpgraded}
                              showSellButton={false}
                              className="w-12 h-20 sm:w-16 sm:h-24 text-xs"
                            />
                          </div>
                        </div>
                        
                         {/* Dragon Info and Action */}
                         <div className="flex-1 w-full">
                           <div className="flex flex-col gap-3">
                             <div>
                               <h4 className="font-medium text-sm sm:text-base">{dragon.name}</h4>
                               <p className="text-xs sm:text-sm text-muted-foreground">
                                 {dragon.faction} • Ранг {dragon.rarity} → {dragon.rarity + 1}
                               </p>
                             </div>
                             
                             {requirements && (
                               <div className="space-y-2">
                                 <div className="flex items-center gap-2">
                                   <Sparkles className="w-3 h-3 text-yellow-500" />
                                   <span className="text-xs font-medium">Шанс успеха: {requirements.successChance}%</span>
                                 </div>
                                 
                                 <div className="space-y-1">
                                   <div className="text-xs font-medium">Требования:</div>
                                   <div className="flex flex-wrap gap-1">
                                     {requirements.costs.balance && (
                                       <Badge variant="outline" className="text-xs">
                                         <Coins className="w-3 h-3 mr-1" />
                                         {requirements.costs.balance}
                                       </Badge>
                                     )}
                                     {requirements.costs.wood && (
                                       <Badge variant="outline" className="text-xs">🪵 {requirements.costs.wood}</Badge>
                                     )}
                                     {requirements.costs.stone && (
                                       <Badge variant="outline" className="text-xs">🪨 {requirements.costs.stone}</Badge>
                                     )}
                                     {requirements.costs.iron && (
                                       <Badge variant="outline" className="text-xs">⚙️ {requirements.costs.iron}</Badge>
                                     )}
                                     {requirements.costs.gold && (
                                       <Badge variant="outline" className="text-xs">💰 {requirements.costs.gold}</Badge>
                                     )}
                                   </div>
                                   
                                   {requirements.requiredItems.length > 0 && (
                                     <div className="flex flex-wrap gap-1 mt-1">
                                       {requirements.requiredItems.map(item => {
                                         const available = itemCounts[item.itemId] || 0;
                                         const hasEnough = available >= item.quantity;
                                         return (
                                           <Badge 
                                             key={item.itemId} 
                                             variant={hasEnough ? "secondary" : "destructive"}
                                             className="text-xs"
                                           >
                                             {item.name}: {available}/{item.quantity}
                                           </Badge>
                                         );
                                       })}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                             
                             <Button
                               onClick={() => initiateDragonUpgrade(dragons)}
                               disabled={!canStartUpgrade() || !canUpgrade}
                               className="w-full sm:w-auto"
                               size="sm"
                             >
                               {!canStartUpgrade() ? 'Нет места' : !canUpgrade ? 'Недостаточно ресурсов' : 'Улучшить'}
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

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Подтверждение улучшения
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {pendingUpgradeDragons.length > 0 && (() => {
                const dragon = pendingUpgradeDragons[0];
                const requirements = getUpgradeRequirement(dragon.rarity, 'dragonLair');
                
                return requirements ? (
                  <>
                    <p>
                      Вы хотите улучшить <strong>{dragon.name}</strong> с {dragon.rarity} до {dragon.rarity + 1} ранга.
                    </p>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                        ⚠️ Шанс успеха: {requirements.successChance}%
                      </p>
                      <p className="text-xs">
                        <strong>При успехе:</strong> Драконы объединятся в улучшенного дракона {dragon.rarity + 1} ранга.
                      </p>
                      <p className="text-xs mt-1">
                        <strong>При неудаче:</strong> Драконы останутся, но все ресурсы и предметы будут потрачены.
                      </p>
                    </div>
                    <p className="text-sm">
                      Будет потрачено: {Object.entries(requirements.costs).filter(([_, v]) => v).map(([key, value]) => 
                        `${key === 'balance' ? 'Монеты' : key === 'wood' ? 'Дерево' : key === 'stone' ? 'Камень' : key === 'iron' ? 'Железо' : 'Золото'}: ${value}`
                      ).join(', ')}
                      {requirements.requiredItems.length > 0 && `, ${requirements.requiredItems.map(i => `${i.name} x${i.quantity}`).join(', ')}`}
                    </p>
                  </>
                ) : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={executeDragonUpgrade}>
              Улучшить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};