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
import { normalizeCardHealth } from '@/utils/cardHealthNormalizer';

interface ForgeBayComponentProps {
  forgeLevel: number;
}

export const ForgeBayComponent = ({ forgeLevel }: ForgeBayComponentProps) => {
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
  const REPAIR_RATE = 1;
  const isStartingRef = useRef(false);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      const hasWorkersInForge = gameState?.activeWorkers?.some((worker: any) => worker.building === 'forge') || false;
      
      if (hasWorkersInForge && forgeBayEntries.length > 0) {
        processForgeBayRepair();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getDamagedCards = () => {
    const cardsInForgeBay = Array.from(new Set(forgeBayEntries.map(entry => entry.card_instance_id)));
    const uniqueCardsMap = new Map();
    
    // Добавляем только карты с валидным instance из card_instances
    cardsWithHealth.forEach(card => {
      const instance = cardInstances.find(ci => ci.card_template_id === card.id);
      // КРИТИЧНО: Добавляем только если есть реальный instance в БД
      if (instance?.id && !uniqueCardsMap.has(instance.id)) {
        uniqueCardsMap.set(instance.id, { card, instance });
      }
    });
    
    selectedTeamWithHealth.forEach(pair => {
      if (pair.hero) {
        const instance = cardInstances.find(ci => ci.card_template_id === pair.hero!.id);
        // КРИТИЧНО: Добавляем только если есть реальный instance в БД
        if (instance?.id && !uniqueCardsMap.has(instance.id)) {
          uniqueCardsMap.set(instance.id, { card: pair.hero, instance });
        }
      }
      if (pair.dragon) {
        const instance = cardInstances.find(ci => ci.card_template_id === pair.dragon!.id);
        // КРИТИЧНО: Добавляем только если есть реальный instance в БД
        if (instance?.id && !uniqueCardsMap.has(instance.id)) {
          uniqueCardsMap.set(instance.id, { card: pair.dragon, instance });
        }
      }
    });
    
    return Array.from(uniqueCardsMap.values())
      .filter(({ card, instance }) => {
        const currentDefense = instance.current_defense ?? (card as any).defense;
        const maxDefense = instance.max_defense ?? (card as any).defense;
        const instanceId = instance.id;
        
        // Карта должна быть повреждена и не находиться в кузнице
        const isDamaged = currentDefense < maxDefense;
        const notInForge = !cardsInForgeBay.includes(instanceId);
        
        return isDamaged && notInForge;
      })
      .map(({ card, instance }) => {
        const normalizedCard = normalizeCardHealth(card);
        return {
          id: instance.id,
          card_template_id: card.id,
          current_defense: instance.current_defense ?? (card as any).defense,
          max_defense: instance.max_defense ?? (card as any).defense,
          card_data: normalizedCard,
          wallet_address: instance.wallet_address || ''
        };
      });
  };

  const getAvailableSlots = () => {
    const maxSlots = forgeLevel + 1;
    return maxSlots - forgeBayEntries.length;
  };

  const handleCardSelect = (card: any) => {
    setSelectedCard(selectedCard?.id === card.id ? null : card);
  };

  const handleStartRepair = async () => {
    if (!selectedCard || isStartingRef.current || loading) return;
    
    isStartingRef.current = true;
    let cardInstanceId = selectedCard.id as string;
    if (String(selectedCard.id).startsWith('virtual-')) {
      cardInstanceId = selectedCard.card_template_id;
    }
    
    const cardToRepair = selectedCard;
    setSelectedCard(null);

    try {
      await placeCardInForgeBay(cardInstanceId);
      await Promise.all([loadCardInstances(), loadForgeBayEntries(), syncHealthFromInstances()]);
    } catch (error) {
      console.error('⚒️ Error starting repair:', error);
      setSelectedCard(cardToRepair);
    } finally {
      isStartingRef.current = false;
    }
  };

  const getEstimatedTimeRemaining = (estimatedCompletion: string) => {
    const diff = new Date(estimatedCompletion).getTime() - Date.now();
    if (diff <= 0) return "Готово";
    
    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} мин.`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  const getRepairProgress = (placedAt: string, estimatedCompletion: string) => {
    const start = new Date(placedAt).getTime();
    const end = new Date(estimatedCompletion).getTime();
    const total = end - start;
    const elapsed = Date.now() - start;
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const damagedCards = getDamagedCards();
  const canStartRepair = getAvailableSlots() > 0;
  const maxSlots = forgeLevel + 1;

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-orange-500" />
              <CardTitle className="text-2xl">Кузница</CardTitle>
            </div>
            <Badge variant="secondary">Слотов: {uniqueForgeEntries.length}/{maxSlots}</Badge>
          </div>
          <CardDescription>
            Восстановление брони поврежденных карт. Доступных слотов: {getAvailableSlots()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>• Скорость ремонта: {REPAIR_RATE} броня/мин</p>
            <p>• Активных ремонтов: {uniqueForgeEntries.length}/{maxSlots}</p>
            <p>• Поврежденных карт: {damagedCards.length}</p>
          </div>
        </CardContent>
      </Card>

      {uniqueForgeEntries.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Ремонт в процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uniqueForgeEntries.map((entry) => {
                const cardData = entry.card_instances?.card_data;
                const progress = getRepairProgress(entry.placed_at, entry.estimated_completion);
                const timeRemaining = getEstimatedTimeRemaining(entry.estimated_completion);
                const isReady = timeRemaining === "Готово";

                return (
                  <div key={entry.id} className="p-4 border border-orange-500/20 rounded-lg">
                    <div className="flex items-start gap-4">
                      {cardData && (
                        <div className="flex-shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">Ремонт:</div>
                          <CardDisplay card={cardData} showSellButton={false} className="w-16 h-24 text-xs" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{cardData?.name || 'Неизвестная карта'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isReady && (
                              <Button
                                onClick={async () => {
                                  await stopRepairWithoutRecovery(entry.card_instance_id);
                                  await Promise.all([loadCardInstances(), loadForgeBayEntries(), syncHealthFromInstances()]);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                disabled={loading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            {isReady && (
                              <Button
                                onClick={async () => {
                                  await removeCardFromForgeBay(entry.card_instance_id);
                                  await Promise.all([loadCardInstances(), loadForgeBayEntries(), syncHealthFromInstances()]);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600"
                                disabled={loading}
                              >
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Забрать
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Статус:</span>
                            <Badge variant={isReady ? "default" : "secondary"}>
                              <Clock className="w-3 h-3 mr-1" />
                              {timeRemaining}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Броня:</span>
                            <span className="font-medium">
                              {entry.card_instances?.current_defense || 0} / {entry.card_instances?.max_defense || 0}
                            </span>
                          </div>
                          
                          {!isReady && <Progress value={progress} className="h-2" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {damagedCards.length > 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Поврежденные карты ({damagedCards.length})
            </CardTitle>
            <CardDescription>
              {canStartRepair ? "Выберите карту для восстановления брони" : "Нет доступных слотов для ремонта"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {damagedCards.map((card: any) => (
                <div
                  key={card.id}
                  className={`cursor-pointer transition-all ${
                    selectedCard?.id === card.id
                      ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-background'
                      : 'hover:ring-2 hover:ring-muted ring-offset-2 ring-offset-background'
                  }`}
                  onClick={() => canStartRepair && handleCardSelect(card)}
                >
                  <CardDisplay card={card.card_data} showSellButton={false} />
                  <div className="mt-2 text-center">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {card.current_defense}/{card.max_defense}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedCard && canStartRepair && (
              <div className="mt-4 p-4 border border-orange-500/20 rounded-lg bg-orange-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{selectedCard.card_data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Броня: {selectedCard.current_defense}/{selectedCard.max_defense}
                    </p>
                  </div>
                  <Button onClick={handleStartRepair} disabled={loading || !canStartRepair} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Начать ремонт
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Восстановление: ~{selectedCard.max_defense - selectedCard.current_defense} мин.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Нет карт, требующих ремонта брони</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
