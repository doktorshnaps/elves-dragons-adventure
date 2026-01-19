import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { Card as CardType, Faction } from '@/types/cards';
import { upgradeCard } from '@/utils/cardUtils';
import { CardDisplay } from '../CardDisplay';
import { useItemInstances } from '@/hooks/useItemInstances';
import { useCards } from '@/hooks/useCards';
import { Shield, Swords, Clock, Star, ArrowRight, Coins, Sparkles, AlertCircle, BookOpen, Skull } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { rollUpgradeSuccess } from '@/utils/upgradeRequirements';
import { useCardUpgradeRequirements } from '@/hooks/useCardUpgradeRequirements';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { accountId } = useWalletContext();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedHeroes, setSelectedHeroes] = useState<CardType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { instances: itemInstances, getCountsByItemId, removeItemInstancesByIds, getInstancesByItemId } = useItemInstances();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pendingUpgradeHeroes, setPendingUpgradeHeroes] = useState<CardType[]>([]);
  const { requirements: allRequirements, getRequirement } = useCardUpgradeRequirements();
  const [factionFilter, setFactionFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  // Мемоизируем подсчет предметов
  const itemCounts = useMemo(() => getCountsByItemId(), [getCountsByItemId]);

  // КРИТИЧНО: Получаем карты ТОЛЬКО из useCards() (единственный источник правды!)
  const { heroes: initializedCards } = useCards();

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
    if (!accountId) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('claim_hero_upgrade', {
        p_wallet_address: accountId,
        p_upgrade_id: upgrade.id
      });

      if (error) throw error;

      const result = data as { success?: boolean; card_name?: string; new_rarity?: number; error?: string } | null;

      if (result?.success) {
        toast({
          title: '✨ Улучшение завершено!',
          description: `${result.card_name} улучшен до ${result.new_rarity} ранга!`,
        });

        // Invalidate caches to refresh UI
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
          queryClient.invalidateQueries({ queryKey: ['gameData'] }),
          queryClient.invalidateQueries({ queryKey: ['gameDataByWallet'] })
        ]);
      } else {
        toast({
          title: 'Ошибка',
          description: result?.error || 'Не удалось забрать улучшенного героя',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error claiming hero upgrade:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось забрать улучшенного героя',
        variant: 'destructive'
      });
    }
  };

  const getAvailableHeroes = (): CardType[] => {
    return initializedCards.filter(card => 
      card.type === 'character' && 
      !activeUpgrades.some(upgrade => upgrade.heroId === card.id || upgrade.heroId === card.instanceId)
    );
  };

  // Find matching recipe for a hero
  const findRecipeForHero = (hero: CardType) => {
    return allRequirements.find(req => {
      if (req.card_type !== 'hero' || req.from_rarity !== hero.rarity || !req.is_active) {
        return false;
      }
      // If recipe has specific faction, it must match
      if (req.faction && req.faction !== hero.faction) {
        return false;
      }
      // If recipe has specific class, it must match
      if (req.card_class && req.card_class !== hero.cardClass) {
        return false;
      }
      return true;
    });
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

    // Filter groups that have at least 2 heroes, can be upgraded at current barracks level,
    // AND have a corresponding upgrade recipe in the database (matching faction and class)
    const filtered: { [key: string]: CardType[] } = {};
    Object.entries(grouped).forEach(([key, heroList]) => {
      const hero = heroList[0];
      const canUpgradeRarity = hero.rarity <= barracksLevel && hero.rarity < 8;
      
      // Check if there's an active upgrade recipe for this specific hero (considering faction/class)
      const recipe = findRecipeForHero(hero);
      
      if (heroList.length >= 2 && canUpgradeRarity && recipe) {
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
    const recipe = findRecipeForHero(hero);
    
    if (!recipe) return { canUpgrade: false, missingItems: ['Нет рецепта для этого героя'] };
    
    const missingItems: string[] = [];
    
    // Check resources from DB recipe
    if (recipe.cost_ell && gameData.balance < recipe.cost_ell) {
      missingItems.push(`Монет: ${recipe.cost_ell - gameData.balance}`);
    }
    if (recipe.cost_wood && gameData.wood < recipe.cost_wood) {
      missingItems.push(`Дерева: ${recipe.cost_wood - gameData.wood}`);
    }
    if (recipe.cost_stone && gameData.stone < recipe.cost_stone) {
      missingItems.push(`Камня: ${recipe.cost_stone - gameData.stone}`);
    }
    if (recipe.cost_iron && gameData.iron < recipe.cost_iron) {
      missingItems.push(`Железа: ${recipe.cost_iron - gameData.iron}`);
    }
    if (recipe.cost_gold && gameData.gold < recipe.cost_gold) {
      missingItems.push(`Золота: ${recipe.cost_gold - gameData.gold}`);
    }
    
    // Check required items from DB recipe
    recipe.required_items?.forEach(reqItem => {
      const available = itemCounts[reqItem.item_id] || 0;
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

    if (!accountId) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return;
    }

    const hero1 = heroes[0];
    const hero2 = heroes[1];
    
    // Use findRecipeForHero to get the matching recipe from DB
    const recipe = findRecipeForHero(hero1);
    
    if (!recipe) {
      toast({
        title: 'Ошибка',
        description: `Рецепт улучшения для этого героя не найден`,
        variant: 'destructive'
      });
      return;
    }

    // Check instanceId for both heroes
    if (!hero1.instanceId || !hero2.instanceId) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить ID карточек',
        variant: 'destructive'
      });
      return;
    }

    // Roll for success FIRST (before any changes)
    const isSuccess = Math.random() * 100 < recipe.success_chance;

    if (!isSuccess) {
      // Failure: only consume resources and items, keep cards
      const resourceUpdates: any = {};
      
      if (recipe.cost_ell) {
        resourceUpdates.balance = gameData.balance - recipe.cost_ell;
      }
      if (recipe.cost_wood) {
        resourceUpdates.wood = gameData.wood - recipe.cost_wood;
      }
      if (recipe.cost_stone) {
        resourceUpdates.stone = gameData.stone - recipe.cost_stone;
      }
      if (recipe.cost_iron) {
        resourceUpdates.iron = gameData.iron - recipe.cost_iron;
      }
      if (recipe.cost_gold) {
        resourceUpdates.gold = gameData.gold - recipe.cost_gold;
      }

      // Remove items
      const itemsToRemove: string[] = [];
      recipe.required_items?.forEach((reqItem) => {
        const instances = getInstancesByItemId(reqItem.item_id);
        itemsToRemove.push(...instances.slice(0, reqItem.quantity).map(i => i.id));
      });

      if (itemsToRemove.length > 0) {
        await removeItemInstancesByIds(itemsToRemove);
      }

      if (Object.keys(resourceUpdates).length > 0) {
        await updateGameData(resourceUpdates);
      }

      toast({
        title: '❌ Улучшение не удалось',
        description: `Попытка улучшения провалилась. Герои остались, но ресурсы потрачены.`,
        variant: 'destructive'
      });

      setUpgradeDialogOpen(false);
      setPendingUpgradeHeroes([]);
      return;
    }

    // Success: start upgrade with timer via RPC
    const upgradeId = `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const upgradeTimeMs = (recipe.upgrade_time_hours || 0) * 60 * 60 * 1000;
    const endTime = Date.now() + upgradeTimeMs;

    // Collect item instance IDs to remove
    const itemsToRemove: string[] = [];
    recipe.required_items?.forEach((reqItem) => {
      const instances = getInstancesByItemId(reqItem.item_id);
      itemsToRemove.push(...instances.slice(0, reqItem.quantity).map(i => i.id));
    });

    // Create base card snapshot for later upgrade
    const baseCard = {
      id: hero1.id,
      name: hero1.name,
      type: hero1.type,
      power: hero1.power,
      defense: hero1.defense,
      health: hero1.health,
      magic: hero1.magic,
      rarity: hero1.rarity,
      faction: hero1.faction,
      cardClass: hero1.cardClass,
      image: hero1.image,
      description: hero1.description
    };

    try {
      const { data, error } = await supabase.rpc('start_hero_upgrade', {
        p_wallet_address: accountId,
        p_card_instance_id_1: hero1.instanceId,
        p_card_instance_id_2: hero2.instanceId,
        p_upgrade_id: upgradeId,
        p_from_rarity: hero1.rarity as number,
        p_to_rarity: (hero1.rarity as number) + 1,
        p_end_time: endTime,
        p_base_card: baseCard,
        p_cost_ell: recipe.cost_ell || 0,
        p_cost_wood: recipe.cost_wood || 0,
        p_cost_stone: recipe.cost_stone || 0,
        p_cost_iron: recipe.cost_iron || 0,
        p_cost_gold: recipe.cost_gold || 0,
        p_item_instance_ids: itemsToRemove
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string; upgrade_id?: string } | null;

      if (result?.success) {
        toast({
          title: '✨ Улучшение запущено!',
          description: upgradeTimeMs > 0 
            ? `${hero1.name} будет улучшен через ${recipe.upgrade_time_hours}ч. Заберите героя когда таймер закончится.`
            : `${hero1.name} улучшается. Заберите героя во вкладке "Активные".`,
        });

        // Invalidate caches to refresh UI
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
          queryClient.invalidateQueries({ queryKey: ['gameData'] }),
          queryClient.invalidateQueries({ queryKey: ['gameDataByWallet'] }),
          queryClient.invalidateQueries({ queryKey: ['itemInstances'] })
        ]);
      } else {
        toast({
          title: 'Ошибка',
          description: result?.error || 'Не удалось начать улучшение',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error starting hero upgrade:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось начать улучшение',
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

  // Filter requirements for recipes tab
  const filteredRequirements = useMemo(() => {
    return allRequirements.filter(req => {
      if (req.card_type !== 'hero') return false;
      if (factionFilter !== 'all' && req.faction !== factionFilter && req.faction !== null) return false;
      if (rarityFilter !== 'all' && req.from_rarity !== parseInt(rarityFilter)) return false;
      return true;
    });
  }, [allRequirements, factionFilter, rarityFilter]);

  const factions: Faction[] = ['Каледор', 'Сильванести', 'Фаэлин', 'Элленар', 'Тэлэрион', 'Аэлантир', 'Лиорас'];

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
            {t(language, 'barracks.upgradeHeroes')}. {t(language, 'barracks.maxUpgrades')} {getMaxConcurrentUpgrades()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• {t(language, 'barracks.atLevel')} {barracksLevel} {t(language, 'barracks.canUpgrade')} {barracksLevel + 1} {t(language, 'barracks.rank')}</p>
              <p>• {t(language, 'barracks.activeUpgrades')} {activeUpgrades.length}/{getMaxConcurrentUpgrades()}</p>
            </div>
            
            {barracksLevel < 8 && (
              <Button onClick={onUpgradeBuilding} variant="outline">
                {t(language, 'barracks.upgradeBarracks')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t(language, 'barracks.recipes')}</span>
          </TabsTrigger>
          <TabsTrigger value="heroes" className="flex items-center gap-2">
            <Swords className="w-4 h-4" />
            <span className="hidden sm:inline">{t(language, 'barracks.heroes')}</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{t(language, 'barracks.active')}</span>
            {activeUpgrades.length > 0 && (
              <Badge variant="secondary" className="ml-1">{activeUpgrades.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="mt-4">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t(language, 'barracks.upgradeRecipes')}
              </CardTitle>
              <CardDescription>
                {t(language, 'barracks.requirements')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{t(language, 'barracks.faction')}</label>
                    <Select value={factionFilter} onValueChange={setFactionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(language, 'barracks.allFactions')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t(language, 'barracks.allFactions')}</SelectItem>
                        {factions.map(faction => (
                          <SelectItem key={faction} value={faction}>{faction}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{t(language, 'barracks.rarity')}</label>
                    <Select value={rarityFilter} onValueChange={setRarityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(language, 'barracks.allRarities')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t(language, 'barracks.allRarities')}</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(rarity => (
                        <SelectItem key={rarity} value={rarity.toString()}>
                          Ранг {rarity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-4">
                {filteredRequirements.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Нет рецептов для выбранных фильтров</p>
                  </div>
                ) : (
                  filteredRequirements.map((req) => (
                    <div key={req.id} className="p-4 border border-primary/20 rounded-lg">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              Улучшение {req.from_rarity} → {req.to_rarity} ранг
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {req.faction && <Badge variant="outline">{req.faction}</Badge>}
                            {req.card_class && <Badge variant="outline">{req.card_class}</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm">Шанс успеха: {req.success_chance}%</span>
                          </div>
                          {req.upgrade_time_hours && req.upgrade_time_hours > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span className="text-sm">Время: {req.upgrade_time_hours}ч</span>
                            </div>
                          )}
                          {req.required_defeated_monsters && req.required_defeated_monsters > 0 && (
                            <div className="flex items-center gap-2">
                              <Skull className="w-3 h-3 text-red-400" />
                              <span className="text-sm">Убитых монстров: {req.required_defeated_monsters}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Требования:</div>
                          <div className="flex flex-wrap gap-1">
                            {req.cost_ell > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Coins className="w-3 h-3 mr-1" />
                                {req.cost_ell}
                              </Badge>
                            )}
                            {req.cost_wood > 0 && (
                              <Badge variant="outline" className="text-xs">🪵 {req.cost_wood}</Badge>
                            )}
                            {req.cost_stone > 0 && (
                              <Badge variant="outline" className="text-xs">🪨 {req.cost_stone}</Badge>
                            )}
                            {req.cost_iron > 0 && (
                              <Badge variant="outline" className="text-xs">⚙️ {req.cost_iron}</Badge>
                            )}
                            {req.cost_gold > 0 && (
                              <Badge variant="outline" className="text-xs">💰 {req.cost_gold}</Badge>
                            )}
                          </div>
                          {req.required_items && Array.isArray(req.required_items) && req.required_items.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {req.required_items.map((item: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {item.name || item.item_id}: {item.quantity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heroes Tab */}
        <TabsContent value="heroes" className="mt-4">
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
                      
                      const recipe = findRecipeForHero(hero);
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
                                 
                                 {recipe && (
                                   <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                       <Sparkles className="w-3 h-3 text-yellow-500" />
                                       <span className="text-xs font-medium">Шанс успеха: {recipe.success_chance}%</span>
                                     </div>
                                     
                                     {recipe.upgrade_time_hours && recipe.upgrade_time_hours > 0 && (
                                       <div className="flex items-center gap-2">
                                         <Clock className="w-3 h-3 text-blue-400" />
                                         <span className="text-xs font-medium">Время: {recipe.upgrade_time_hours}ч</span>
                                       </div>
                                     )}
                                     
                                     {recipe.required_defeated_monsters && recipe.required_defeated_monsters > 0 && (
                                       <div className="flex items-center gap-2">
                                         <Skull className="w-3 h-3 text-red-400" />
                                         <span className="text-xs font-medium">Убитых монстров: {recipe.required_defeated_monsters}</span>
                                       </div>
                                     )}
                                     
                                     <div className="space-y-1">
                                       <div className="text-xs font-medium">Требования:</div>
                                       <div className="flex flex-wrap gap-1">
                                         {recipe.cost_ell > 0 && (
                                           <Badge variant="outline" className="text-xs">
                                             <Coins className="w-3 h-3 mr-1" />
                                             {recipe.cost_ell}
                                           </Badge>
                                         )}
                                         {recipe.cost_wood && recipe.cost_wood > 0 && (
                                           <Badge variant="outline" className="text-xs">🪵 {recipe.cost_wood}</Badge>
                                         )}
                                         {recipe.cost_stone && recipe.cost_stone > 0 && (
                                           <Badge variant="outline" className="text-xs">🪨 {recipe.cost_stone}</Badge>
                                         )}
                                         {recipe.cost_iron && recipe.cost_iron > 0 && (
                                           <Badge variant="outline" className="text-xs">⚙️ {recipe.cost_iron}</Badge>
                                         )}
                                         {recipe.cost_gold && recipe.cost_gold > 0 && (
                                           <Badge variant="outline" className="text-xs">💰 {recipe.cost_gold}</Badge>
                                         )}
                                       </div>
                                       
                                       {recipe.required_items && recipe.required_items.length > 0 && (
                                         <div className="flex flex-wrap gap-1 mt-1">
                                           {recipe.required_items.map(item => {
                                             const available = itemCounts[item.item_id] || 0;
                                             const hasEnough = available >= item.quantity;
                                             return (
                                               <Badge 
                                                 key={item.item_id} 
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
        </TabsContent>

        {/* Active Upgrades Tab */}
        <TabsContent value="active" className="mt-4">
          {activeUpgrades.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет активных улучшений</p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
        </TabsContent>
      </Tabs>

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
                const recipe = findRecipeForHero(hero);
                
                return recipe ? (
                  <>
                    <p>
                      Вы хотите улучшить <strong>{hero.name}</strong> с {hero.rarity} до {hero.rarity + 1} ранга.
                    </p>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                        ⚠️ Шанс успеха: {recipe.success_chance}%
                      </p>
                      <p className="text-xs">
                        <strong>При успехе:</strong> Герои и ресурсы будут потрачены, улучшенный герой появится 
                        {recipe.upgrade_time_hours && recipe.upgrade_time_hours > 0 
                          ? ` через ${recipe.upgrade_time_hours}ч. Заберите его во вкладке "Активные".`
                          : ' сразу во вкладке "Активные".'}
                      </p>
                      <p className="text-xs mt-1">
                        <strong>При неудаче:</strong> Герои останутся, но все ресурсы и предметы будут потрачены.
                      </p>
                    </div>
                    {recipe.upgrade_time_hours && recipe.upgrade_time_hours > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-500">
                        <Clock className="w-4 h-4" />
                        <span>Время улучшения: {recipe.upgrade_time_hours}ч</span>
                      </div>
                    )}
                    <p className="text-sm">
                      Будет потрачено: {[
                        recipe.cost_ell > 0 && `Монеты: ${recipe.cost_ell}`,
                        recipe.cost_wood && recipe.cost_wood > 0 && `Дерево: ${recipe.cost_wood}`,
                        recipe.cost_stone && recipe.cost_stone > 0 && `Камень: ${recipe.cost_stone}`,
                        recipe.cost_iron && recipe.cost_iron > 0 && `Железо: ${recipe.cost_iron}`,
                        recipe.cost_gold && recipe.cost_gold > 0 && `Золото: ${recipe.cost_gold}`
                      ].filter(Boolean).join(', ')}
                      {recipe.required_items && recipe.required_items.length > 0 && `, ${recipe.required_items.map(i => `${i.name} x${i.quantity}`).join(', ')}`}
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