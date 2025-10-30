import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { Card as CardType } from '@/types/cards';
import { upgradeCard } from '@/utils/cardUtils';
import { CardDisplay } from '../CardDisplay';
import { useItemInstances } from '@/hooks/useItemInstances';
import { initializeCardHealth } from '@/utils/cardHealthUtils';
import { Shield, Swords, Clock, Star, ArrowRight, Coins, Sparkles, AlertCircle } from 'lucide-react';
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
  const { language } = useLanguage();
  const [selectedHeroes, setSelectedHeroes] = useState<CardType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { instances: itemInstances, getCountsByItemId, removeItemInstancesByIds } = useItemInstances();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pendingUpgradeHeroes, setPendingUpgradeHeroes] = useState<CardType[]>([]);

  // Мемоизируем подсчет предметов
  const itemCounts = useMemo(() => getCountsByItemId(), [getCountsByItemId]);

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

  const checkUpgradeRequirements = (heroes: CardType[]): { canUpgrade: boolean; missingItems: string[] } => {
    if (heroes.length < 2) return { canUpgrade: false, missingItems: ['Недостаточно героев'] };
    
    const hero = heroes[0];
    const requirements = getUpgradeRequirement(hero.rarity, 'barracks');
    
    if (!requirements) return { canUpgrade: false, missingItems: ['Нет данных об улучшении'] };
    
    const missingItems: string[] = [];
    
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

  const initiateUpgrade = (heroes: CardType[]) => {
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

    const hero = heroes[0];
    
    if (hero.rarity > barracksLevel) {
      toast({
        title: 'Недостаточный уровень казармы',
        description: `Для улучшения героев ${hero.rarity} ранга нужна казарма уровня ${hero.rarity}`,
        variant: 'destructive'
      });
      return;
    }

    const { canUpgrade, missingItems } = checkUpgradeRequirements(heroes);
    
    if (!canUpgrade) {
      toast({
        title: 'Недостаточно ресурсов',
        description: `Не хватает: ${missingItems.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setPendingUpgradeHeroes(heroes);
    setUpgradeDialogOpen(true);
  };

  const executeUpgrade = async () => {
    const heroes = pendingUpgradeHeroes;
    if (heroes.length < 2) return;

    const hero1 = heroes[0];
    const hero2 = heroes[1];
    const requirements = getUpgradeRequirement(hero1.rarity, 'barracks');
    
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
      // Success: create upgraded hero immediately
      const upgradedHero: CardType = {
        ...hero1,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        rarity: (hero1.rarity + 1) as any,
        power: Math.floor(hero1.power * 1.8),
        defense: Math.floor(hero1.defense * 1.8),
        health: Math.floor(hero1.health * 1.8),
        magic: Math.floor(hero1.magic * 1.8)
      };

      // Remove both heroes and add upgraded one
      const currentCards = gameData.cards as CardType[] || [];
      const newCards = currentCards
        .filter(c => c.id !== hero1.id && c.id !== hero2.id)
        .concat(upgradedHero);

      await updateGameData({
        ...resourceUpdates,
        cards: newCards
      });

      toast({
        title: '✨ Улучшение успешно!',
        description: `${hero1.name} улучшен до ${hero1.rarity + 1} ранга!`,
      });

      // Dispatch event to update cards
      const cardsEvent = new CustomEvent('cardsUpdate', {
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);
    } else {
      // Failure: heroes stay, but resources are consumed
      await updateGameData(resourceUpdates);

      toast({
        title: '❌ Улучшение не удалось',
        description: `Попытка улучшения провалилась. Герои остались, но ресурсы потрачены.`,
        variant: 'destructive'
      });
    }

    setUpgradeDialogOpen(false);
    setPendingUpgradeHeroes([]);
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
                                  onClick={() => completeUpgrade(upgrade)}
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

      {/* Available Heroes for Upgrade */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            {t(language, 'shelter.availableHeroes')}
          </CardTitle>
          <CardDescription>
            {t(language, 'shelter.selectTwoHeroes')}
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
                  
                  const requirements = getUpgradeRequirement(hero.rarity, 'barracks');
                  const { canUpgrade, missingItems } = checkUpgradeRequirements(heroes);
                  
                  return (
                     <div key={key} className="p-2 sm:p-4 border border-primary/20 rounded-lg overflow-hidden">
                       <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 mb-4">
                        {/* Current Heroes Preview */}
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <div className="text-xs text-muted-foreground mb-2">
                            Требуется: 2 карты (доступно: {heroes.length})
                          </div>
                          <div className="flex gap-1 justify-center sm:justify-start">
                            <CardDisplay 
                              card={hero}
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
                        
                         {/* Hero Info and Action */}
                         <div className="flex-1 w-full">
                           <div className="flex flex-col gap-3">
                             <div>
                               <h4 className="font-medium text-sm sm:text-base">{hero.name}</h4>
                               <p className="text-xs sm:text-sm text-muted-foreground">
                                 {hero.faction} • Ранг {hero.rarity} → {hero.rarity + 1}
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
                               onClick={() => initiateUpgrade(heroes)}
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
              {pendingUpgradeHeroes.length > 0 && (() => {
                const hero = pendingUpgradeHeroes[0];
                const requirements = getUpgradeRequirement(hero.rarity, 'barracks');
                
                return requirements ? (
                  <>
                    <p>
                      Вы хотите улучшить <strong>{hero.name}</strong> с {hero.rarity} до {hero.rarity + 1} ранга.
                    </p>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                        ⚠️ Шанс успеха: {requirements.successChance}%
                      </p>
                      <p className="text-xs">
                        <strong>При успехе:</strong> Герои объединятся в улучшенного героя {hero.rarity + 1} ранга.
                      </p>
                      <p className="text-xs mt-1">
                        <strong>При неудаче:</strong> Герои останутся, но все ресурсы и предметы будут потрачены.
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
            <AlertDialogAction onClick={executeUpgrade}>
              Улучшить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};