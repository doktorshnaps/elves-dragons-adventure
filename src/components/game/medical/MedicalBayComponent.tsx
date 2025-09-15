import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Heart, Plus, Activity, ArrowRight } from 'lucide-react';
import { useMedicalBay } from '@/hooks/useMedicalBay';
import { useCardInstances } from '@/hooks/useCardInstances';
import { CardDisplay } from '../CardDisplay';

export const MedicalBayComponent = () => {
  const {
    medicalBayEntries,
    loading,
    loadMedicalBayEntries,
    placeCardInMedicalBay,
    removeCardFromMedicalBay,
    processMedicalBayHealing
  } = useMedicalBay();

  const { cardInstances, loadCardInstances } = useCardInstances();
  const [selectedCard, setSelectedCard] = useState<any>(null);

  useEffect(() => {
    loadMedicalBayEntries();
    loadCardInstances();
  }, [loadMedicalBayEntries, loadCardInstances]);

  // Автоматическая обработка лечения каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      processMedicalBayHealing();
    }, 60000); // каждую минуту

    return () => clearInterval(interval);
  }, [processMedicalBayHealing]);

  const getInjuredCards = () => {
    // Получаем ID карт, которые сейчас в медпункте
    const cardsInMedicalBay = medicalBayEntries.map(entry => entry.card_instance_id);
    
    return cardInstances.filter(card => 
      card.current_health < card.max_health && 
      !cardsInMedicalBay.includes(card.id)
    );
  };

  const getAvailableSlots = () => {
    // Максимум 3 слота в медпункте
    return 3 - medicalBayEntries.length;
  };

  const handleCardSelect = (card: any) => {
    setSelectedCard(selectedCard?.id === card.id ? null : card);
  };

  const handleStartHealing = async () => {
    if (!selectedCard) return;
    
    await placeCardInMedicalBay(selectedCard.id);
    setSelectedCard(null);
  };

  const getEstimatedTimeRemaining = (estimatedCompletion: string) => {
    const now = new Date();
    const completion = new Date(estimatedCompletion);
    const diff = completion.getTime() - now.getTime();
    
    if (diff <= 0) return "Готово";
    
    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} мин.`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  const getHealingProgress = (placedAt: string, estimatedCompletion: string) => {
    const now = new Date();
    const start = new Date(placedAt);
    const end = new Date(estimatedCompletion);
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const injuredCards = getInjuredCards();
  const canStartHealing = getAvailableSlots() > 0;

  return (
    <div className="space-y-6">
      {/* Medical Bay Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <CardTitle className="text-2xl">Медпункт</CardTitle>
            </div>
            <Badge variant="secondary">
              Слотов: {medicalBayEntries.length}/3
            </Badge>
          </div>
          <CardDescription>
            Восстановление здоровья поврежденных карт. Доступных слотов: {getAvailableSlots()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Скорость лечения: 10 HP/мин</p>
              <p>• Активных лечений: {medicalBayEntries.length}/3</p>
              <p>• Раненых карт: {injuredCards.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Healing Processes */}
      {medicalBayEntries.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Лечение в процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicalBayEntries.map((entry) => {
                const cardData = entry.card_instances?.card_data;
                const progress = getHealingProgress(entry.placed_at, entry.estimated_completion);
                const timeRemaining = getEstimatedTimeRemaining(entry.estimated_completion);
                const isReady = timeRemaining === "Готово";

                return (
                  <div key={entry.id} className="p-4 border border-green-500/20 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Card Preview */}
                      {cardData && (
                        <div className="flex-shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">Лечится:</div>
                          <CardDisplay 
                            card={cardData}
                            showSellButton={false}
                            className="w-16 h-24 text-xs"
                          />
                        </div>
                      )}
                      
                      {/* Healing Progress Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-medium">
                              {cardData?.name || 'Неизвестная карта'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isReady ? (
                              <Button 
                                onClick={async () => {
                                  await removeCardFromMedicalBay(entry.card_instance_id);
                                  await Promise.all([
                                    loadCardInstances(),
                                    loadMedicalBayEntries()
                                  ]);
                                }}
                                size="sm"
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Забрать
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="w-4 h-4" />
                                {timeRemaining}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Прогресс лечения:</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          {!isReady && <Progress value={progress} className="h-2" />}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-2">
                          Скорость лечения: {entry.heal_rate} HP/мин
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

      {/* Card Selection for Healing */}
      <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Отправить на лечение
            </CardTitle>
            {selectedCard && (
              <Button 
                onClick={handleStartHealing}
                disabled={loading || !canStartHealing}
                className="bg-red-600 hover:bg-red-700"
              >
                Начать лечение
              </Button>
            )}
          </div>
          <CardDescription>
            {canStartHealing 
              ? "Выберите поврежденную карту для отправки в медпункт"
              : "Нет свободных слотов в медпункте"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {injuredCards.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Все карты здоровы!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {injuredCards.map((card) => {
                const healthPercentage = (card.current_health / card.max_health) * 100;
                const cardData = card.card_data;
                const isSelected = selectedCard?.id === card.id;

                return (
                  <div 
                    key={card.id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-red-500 scale-105' 
                        : canStartHealing 
                          ? 'hover:scale-105' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canStartHealing && handleCardSelect(card)}
                  >
                    <div className="relative">
                      <CardDisplay 
                        card={cardData}
                        showSellButton={false}
                        className="w-full"
                      />
                      
                      {/* Health Bar Overlay */}
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="bg-black/50 rounded px-1 py-0.5">
                          <div className="flex justify-between text-xs text-white mb-1">
                            <span>HP:</span>
                            <span>{card.current_health}/{card.max_health}</span>
                          </div>
                          <Progress 
                            value={healthPercentage} 
                            className="h-1"
                          />
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
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

      {/* Selected Card Preview */}
      {selectedCard && (
        <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-red-500" />
              Предпросмотр лечения
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
                  <div className="bg-red-500/20 rounded px-2 py-1">
                    HP: {selectedCard.current_health}/{selectedCard.max_health}
                  </div>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="flex-shrink-0 flex items-center mt-8">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* After Healing */}
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2">После лечения:</div>
                <CardDisplay 
                  card={selectedCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-green-500/20 rounded px-2 py-1">
                    HP: {selectedCard.max_health}/{selectedCard.max_health}
                  </div>
                </div>
              </div>
              
              {/* Healing Info */}
              <div className="flex-1 ml-4">
                <h4 className="font-medium mb-2">{selectedCard.card_data?.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Нужно восстановить:</span>
                    <span className="text-red-500">{selectedCard.max_health - selectedCard.current_health} HP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Время лечения:</span>
                    <span>{Math.ceil((selectedCard.max_health - selectedCard.current_health) / 10)} мин</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Скорость:</span>
                    <span>10 HP/мин</span>
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