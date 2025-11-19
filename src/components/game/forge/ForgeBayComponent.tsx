import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Plus, Activity, ArrowRight, X } from 'lucide-react';
import { useForgeBay } from '@/hooks/useForgeBay';
import { useCardInstances } from '@/hooks/useCardInstances';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { CardDisplay } from '../CardDisplay';

export const ForgeBayComponent = () => {
  const {
    forgeBayEntries,
    loading,
    loadForgeBayEntries,
    placeCardInForgeBay,
    removeCardFromForgeBay,
    stopRepairWithoutRecovery,
    processForgeBayRepair
  } = useForgeBay();

  const { cardInstances, loadCardInstances } = useCardInstances();
  const { syncHealthFromInstances } = useCardHealthSync();
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const gameState = useUnifiedGameState();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const REPAIR_RATE = 100;
  const isStartingRef = useRef(false);

  // Уникальные записи кузницы
  const uniqueForgeEntries = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of forgeBayEntries) {
      if (!map.has(e.card_instance_id)) map.set(e.card_instance_id, e);
      else {
        const existing = map.get(e.card_instance_id);
        const existingTime = new Date(existing.placed_at).getTime();
        const currentTime = new Date(e.placed_at).getTime();
        if (currentTime < existingTime) map.set(e.card_instance_id, e);
      }
    }
    return Array.from(map.values());
  }, [forgeBayEntries]);

  useEffect(() => {
    loadForgeBayEntries();
    loadCardInstances();
  }, [loadForgeBayEntries, loadCardInstances]);

  // Автоматическая обработка ремонта каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      const hasWorkersInForge = cardsWithHealth.some(card => 
        (card as any)?.assignedBuilding === 'forge'
      ) || 
      gameState?.activeWorkers?.some((worker: any) => worker.building === 'forge') || false;
      
      if (hasWorkersInForge && forgeBayEntries.length > 0) {
        console.log('⚒️ Processing automatic repair...');
        processForgeBayRepair();
      } else if (!hasWorkersInForge) {
        console.log('⚒️ Forge bay inactive - no workers assigned');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [processForgeBayRepair, forgeBayEntries.length]);

  const getDamagedCards = () => {
    console.log('⚒️ Getting damaged cards...');
    
    const cardsInForgeBay = Array.from(new Set(forgeBayEntries.map(entry => entry.card_instance_id)));
    console.log('⚒️ Cards in forge bay:', cardsInForgeBay);
    
    const uniqueCardsMap = new Map();
    
    cardsWithHealth.forEach(card => {
      const instance = cardInstances.find(ci => ci.card_template_id === card.id);
      const instanceId = instance?.id || card.id;
      if (!uniqueCardsMap.has(instanceId)) {
        uniqueCardsMap.set(instanceId, { card, instance });
      }
    });
    
    selectedTeamWithHealth.forEach(pair => {
      if (pair.hero) {
        const instance = cardInstances.find(ci => ci.card_template_id === pair.hero!.id);
        const instanceId = instance?.id || pair.hero.id;
        if (!uniqueCardsMap.has(instanceId)) {
          uniqueCardsMap.set(instanceId, { card: pair.hero, instance });
        }
      }
      if (pair.dragon) {
        const instance = cardInstances.find(ci => ci.card_template_id === pair.dragon!.id);
        const instanceId = instance?.id || pair.dragon.id;
        if (!uniqueCardsMap.has(instanceId)) {
          uniqueCardsMap.set(instanceId, { card: pair.dragon, instance });
        }
      }
    });

    const damagedCards = Array.from(uniqueCardsMap.values())
      .filter(({ card, instance }) => {
        const currentDefense = instance?.current_defense ?? card.currentDefense ?? card.defense;
        const maxDefense = instance?.max_defense ?? card.maxDefense ?? card.defense;
        const instanceId = instance?.id || card.id;
        const isInForge = cardsInForgeBay.includes(instanceId);
        
        return currentDefense < maxDefense && !isInForge;
      });

    console.log('⚒️ Damaged cards:', damagedCards.length);
    return damagedCards;
  };

  const damagedCards = getDamagedCards();

  const handleStartRepair = async () => {
    if (!selectedCard || isStartingRef.current) {
      console.log('⚒️ Guard: selectedCard or isStartingRef check failed');
      return;
    }

    console.log('⚒️ Starting repair for card:', selectedCard);
    isStartingRef.current = true;

    try {
      await placeCardInForgeBay(selectedCard.card.id);
      setSelectedCard(null);
      await syncHealthFromInstances();
    } finally {
      isStartingRef.current = false;
    }
  };

  const handleRemoveCard = async (cardInstanceId: string) => {
    await removeCardFromForgeBay(cardInstanceId);
    await syncHealthFromInstances();
  };

  const handleStopRepair = async (cardInstanceId: string) => {
    await stopRepairWithoutRecovery(cardInstanceId);
    await syncHealthFromInstances();
  };

  const calculateRepairProgress = (entry: any) => {
    if (!entry.card_data) return 0;
    
    const placedTime = new Date(entry.placed_at).getTime();
    const currentTime = Date.now();
    const hoursElapsed = (currentTime - placedTime) / (1000 * 60 * 60);
    const armorRestored = Math.floor(hoursElapsed * entry.repair_rate);
    
    const currentDefense = entry.card_data.current_defense;
    const maxDefense = entry.card_data.max_defense;
    const projectedDefense = Math.min(currentDefense + armorRestored, maxDefense);
    
    return ((projectedDefense - currentDefense) / (maxDefense - currentDefense)) * 100;
  };

  const calculateTimeRemaining = (entry: any) => {
    if (!entry.card_data) return 'Расчет...';
    
    const currentDefense = entry.card_data.current_defense;
    const maxDefense = entry.card_data.max_defense;
    const defenseNeeded = maxDefense - currentDefense;
    
    const placedTime = new Date(entry.placed_at).getTime();
    const currentTime = Date.now();
    const hoursElapsed = (currentTime - placedTime) / (1000 * 60 * 60);
    const armorRestored = Math.floor(hoursElapsed * entry.repair_rate);
    
    const remainingDefense = defenseNeeded - armorRestored;
    
    if (remainingDefense <= 0) return 'Готово';
    
    const hoursRemaining = Math.ceil(remainingDefense / entry.repair_rate);
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.ceil((remainingDefense / entry.repair_rate) * 60);
      return `${minutesRemaining} мин`;
    }
    
    return `${hoursRemaining} ч`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Кузница
          </CardTitle>
          <CardDescription>
            Восстановление брони карт героев и драконов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Слоты ремонта (Макс: 3)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueForgeEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет карт на ремонте</p>
                  </div>
                ) : (
                  uniqueForgeEntries.map((entry) => (
                    <Card key={entry.id} className="bg-background/80 relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {entry.card_data?.card_data?.name || 'Карта'}
                              </span>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {calculateTimeRemaining(entry)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Броня:</span>
                                <span className="font-medium">
                                  {entry.card_data?.current_defense}/{entry.card_data?.max_defense}
                                </span>
                              </div>
                              <Progress 
                                value={calculateRepairProgress(entry)} 
                                className="h-2"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveCard(entry.card_instance_id)}
                                disabled={loading}
                                className="flex-1"
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Забрать
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStopRepair(entry.card_instance_id)}
                                disabled={loading}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Поврежденные карты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {damagedCards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет поврежденных карт</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                    {damagedCards.map(({ card, instance }) => {
                      const currentDefense = instance?.current_defense ?? card.currentDefense ?? card.defense;
                      const maxDefense = instance?.max_defense ?? card.maxDefense ?? card.defense;
                      const isSelected = selectedCard?.card?.id === card.id;

                      return (
                        <div
                          key={instance?.id || card.id}
                          onClick={() => setSelectedCard({ card, instance })}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
                          }`}
                        >
                          <CardDisplay card={card} />
                          <div className="mt-1 text-xs text-center">
                            <Badge variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {currentDefense}/{maxDefense}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCard && (
                  <Button
                    onClick={handleStartRepair}
                    disabled={loading || uniqueForgeEntries.length >= 3}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Начать ремонт
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
