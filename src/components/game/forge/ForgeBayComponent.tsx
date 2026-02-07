import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Plus, Activity, ArrowRight, X } from 'lucide-react';
import { useForgeBay } from '@/hooks/useForgeBay';
import { useMedicalBay } from '@/hooks/useMedicalBay';
import { useCardInstancesContext } from '@/providers/CardInstancesProvider';

console.log('⚒️ [ForgeBayComponent] Loaded - using centralized CardInstancesContext');
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { CardDisplay } from '../CardDisplay';

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

  // Получаем записи медпункта для проверки занятых карт
  const { medicalBayEntries } = useMedicalBay();

  // КРИТИЧНО: Получаем данные ТОЛЬКО из провайдера
  const { cardInstances, loadCardInstances } = useCardInstancesContext();
  
  console.log('⚒️ [ForgeBayComponent] CardInstances from context:', {
    total: cardInstances.length,
    withDamage: cardInstances.filter(ci => ci.current_defense < ci.max_defense).length
  });
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
    
    // КРИТИЧНО: Получаем карты НАПРЯМУЮ из cardInstances (источник правды!)
    // Не используем cardsWithHealth или selectedTeamWithHealth - они могут содержать старые данные
    cardInstances.forEach(instance => {
      // Только герои и драконы
      if (instance.card_type === 'hero' || instance.card_type === 'dragon') {
        const instanceId = instance.id;
        if (!uniqueCardsMap.has(instanceId)) {
          // Строим card объект из instance.card_data
          const cardData = instance.card_data as any;
          const rawType = cardData.type || instance.card_type || 'character';
          const normalizedType = rawType === 'hero' ? 'character' : rawType === 'dragon' ? 'pet' : rawType;
          const card = {
            id: instance.id,
            instanceId: instance.id,
            name: cardData.name,
            type: normalizedType,
            faction: cardData.faction,
            rarity: cardData.rarity,
            image: cardData.image,
            power: instance.max_power,
            defense: instance.max_defense,
            health: instance.max_health,
            magic: instance.max_magic,
            currentHealth: instance.current_health,
            currentDefense: instance.current_defense,
            maxDefense: instance.max_defense
          };
          uniqueCardsMap.set(instanceId, { card, instance });
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
        // НЕ используем normalizeCardHealth - оно пересчитывает характеристики!
        // Используем card_data только для метаданных (имя, изображение, фракция)
        return {
          id: instance.id,
          card_template_id: card.id,
          current_health: instance.current_health,
          max_health: instance.max_health,
          current_defense: instance.current_defense,
          max_defense: instance.max_defense,
          max_power: instance.max_power,
          max_magic: instance.max_magic,
          card_data: card, // Используем card_data только для метаданных
          wallet_address: instance.wallet_address
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
      // Данные обновятся автоматически через Real-time подписки
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
                          <CardDisplay 
                            card={{
                              ...cardData,
                              // КРИТИЧНО: Используем ВСЕ характеристики из card_instances
                              health: entry.card_instances?.max_health ?? cardData.health,
                              currentHealth: entry.card_instances?.current_health ?? cardData.currentHealth,
                              currentDefense: entry.card_instances?.current_defense ?? cardData.currentDefense,
                              maxDefense: entry.card_instances?.max_defense ?? cardData.maxDefense,
                              power: entry.card_instances?.max_power ?? cardData.power,
                              defense: entry.card_instances?.max_defense ?? cardData.defense,
                              magic: entry.card_instances?.max_magic ?? cardData.magic
                            }} 
                            showSellButton={false} 
                            className="w-16 h-24 text-xs" 
                          />
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
                                  // Данные обновятся автоматически через Real-time подписки
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
                                  // Данные обновятся автоматически через Real-time подписки
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
                              {isReady 
                                ? `${entry.card_instances?.max_defense || 0} / ${entry.card_instances?.max_defense || 0}`
                                : `${entry.card_instances?.current_defense || 0} / ${entry.card_instances?.max_defense || 0}`
                              }
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
        <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Отправить на ремонт
              </CardTitle>
              {selectedCard && (
                <Button 
                  onClick={handleStartRepair}
                  disabled={loading || !canStartRepair}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Начать ремонт
                </Button>
              )}
            </div>
            <CardDescription>
              {canStartRepair ? "Выберите карту для ремонта" : "Нет доступных слотов для ремонта"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {damagedCards.map((card: any) => {
                const defensePercentage = (card.current_defense / card.max_defense) * 100;
                const cardData = card.card_data;
                const isSelected = selectedCard?.id === card.id;
                // Проверяем, находится ли карта в медпункте
                const isInMedicalBay = medicalBayEntries.some(entry => entry.card_instance_id === card.id);
                const isBusy = isInMedicalBay;

                return (
                  <div
                    key={card.id}
                    className={`relative transition-all duration-200 ${
                      isBusy
                        ? 'opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'ring-2 ring-orange-500 scale-105 cursor-pointer'
                          : canStartRepair
                            ? 'hover:scale-105 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBusy && canStartRepair && !loading) {
                        handleCardSelect(card);
                      }
                    }}
                  >
                    <div className="relative">
                      <CardDisplay
                        card={{
                          ...cardData,
                          // КРИТИЧНО: Используем ВСЕ характеристики из card_instances (из card объекта, НЕ из JSON)
                          health: card.max_health,
                          currentHealth: card.current_health,
                          currentDefense: card.current_defense,
                          maxDefense: card.max_defense,
                          power: card.max_power,
                          defense: card.max_defense,
                          magic: card.max_magic
                        }}
                        showSellButton={false}
                        className="w-full"
                      />
                      
                      {/* Busy Indicator - показываем метку занятости */}
                      {isBusy && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Лечится
                          </div>
                        </div>
                      )}
                      
                      {/* Selection Indicator */}
                      {!isBusy && isSelected && (
                        <div className="absolute top-2 left-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

      {/* Selected Card Preview */}
      {selectedCard && (
        <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-orange-500" />
              Предпросмотр ремонта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {/* Current State */}
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2">Текущее состояние:</div>
                <CardDisplay 
                  card={selectedCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-orange-500/20 rounded px-2 py-1">
                    Броня: {selectedCard.current_defense}/{selectedCard.max_defense}
                  </div>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="flex-shrink-0 flex items-center mt-8">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* After Repair */}
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2">После ремонта:</div>
                <CardDisplay 
                  card={selectedCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-green-500/20 rounded px-2 py-1">
                    Броня: {selectedCard.max_defense}/{selectedCard.max_defense}
                  </div>
                </div>
              </div>
              
              {/* Repair Info */}
              <div className="flex-1 ml-4">
                <h4 className="font-medium mb-2">{selectedCard.card_data?.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Нужно восстановить:</span>
                    <span className="text-orange-500">{selectedCard.max_defense - selectedCard.current_defense} брони</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Время ремонта:</span>
                    <span>{selectedCard.max_defense - selectedCard.current_defense} мин</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Скорость:</span>
                    <span>{REPAIR_RATE} броня/мин</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
