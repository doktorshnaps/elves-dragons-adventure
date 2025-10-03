import { useState, useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDisplay } from "../CardDisplay";
import { CardPreviewModal } from "../cards/CardPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { useCardInstances } from "@/hooks/useCardInstances";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
interface DeckSelectionProps {
  cards: CardType[];
  selectedPairs: TeamPair[];
  onPairSelect: (hero: CardType, dragon?: CardType) => void;
  onPairRemove: (index: number) => void;
  onPairAssignDragon: (index: number, dragon: CardType) => void;
  onPairRemoveDragon: (index: number) => void;
}
export interface TeamPair {
  hero: CardType;
  dragon?: CardType;
}
export const DeckSelection = ({
  cards,
  selectedPairs,
  onPairSelect,
  onPairRemove,
  onPairAssignDragon,
  onPairRemoveDragon
}: DeckSelectionProps) => {
  const [showHeroDeck, setShowHeroDeck] = useState(false);
  const [showDragonDeck, setShowDragonDeck] = useState(false);
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);
  const [previewAction, setPreviewAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [previewDeleteAction, setPreviewDeleteAction] = useState<{
    label: string;
    action: () => void;
  } | null>(null);
  const [localCards, setLocalCards] = useState<CardType[]>(cards);
  const {
    toast
  } = useToast();

  // Интеграция NFT карт
  const {
    nftCards,
    isLoading: nftLoading
  } = useNFTCardIntegration();

  // Получаем актуальные card instances для отображения здоровья
  const {
    cardInstances
  } = useCardInstances();

  // Создаем карты с актуальным здоровьем из card_instances
  const cardsWithHealthSync = useMemo(() => {
    const combinedCards = [...cards, ...nftCards];
    // Убираем дубликаты по ID
    const uniqueCards = combinedCards.filter((card, index, arr) => arr.findIndex(c => c.id === card.id) === index);

    // Синхронизируем здоровье с card_instances
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    return uniqueCards.map(card => {
      const instance = instancesMap.get(card.id);
      if (instance) {
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime()
        };
      }
      return card;
    });
  }, [cards, nftCards, cardInstances]);

  // Обновляем локальные карты, исключаем только карты которые действительно в медпункте
  useEffect(() => {
    // НЕ фильтруем карты - показываем все доступные карты
    setLocalCards(cardsWithHealthSync);
    console.log('🎮 Updated local cards with health sync:', cardsWithHealthSync.length, 'total cards');
  }, [cardsWithHealthSync]);
  const heroes = localCards.filter(card => card.type === 'character');
  const dragons = localCards.filter(card => card.type === 'pet');
  const isHeroSelected = (hero: CardType) => {
    return selectedPairs.some(pair => pair.hero.id === hero.id);
  };
  const isDragonSelected = (dragon: CardType) => {
    return selectedPairs.some(pair => pair.dragon?.id === dragon.id);
  };
  const getAvailableDragons = (heroFaction?: string, heroRarity?: number) => {
    if (!heroFaction) return [];
    return dragons.filter(dragon => dragon.faction === heroFaction && (!heroRarity || dragon.rarity <= heroRarity) && !isDragonSelected(dragon));
  };
  const handleHeroSelect = (hero: CardType) => {
    console.log('🎯 DeckSelection handleHeroSelect called for hero:', hero.name);
    console.log('🎯 selectedPairs.length:', selectedPairs.length);
    console.log('🎯 Is hero already selected in filtered pairs?', selectedPairs.some(pair => pair.hero.id === hero.id));
    
    // Note: We don't check selectedPairs.length here because the real limit check is in handlePairSelect
    console.log('🎯 Calling onPairSelect from DeckSelection');
    onPairSelect(hero);
    setShowHeroDeck(false);
  };
  const handleDragonSelect = (dragon: CardType) => {
    if (activePairIndex !== null) {
      const pair = selectedPairs[activePairIndex];
      if (pair) {
        if (pair.hero.faction !== dragon.faction) {
          toast({
            title: 'Неверная фракция',
            description: 'Дракон должен быть той же фракции, что и герой',
            variant: 'destructive'
          });
        } else if ((pair.hero.rarity ?? 0) < dragon.rarity) {
          toast({
            title: 'Недостаточный ранг героя',
            description: 'Герой может управлять драконом своего ранга или ниже',
            variant: 'destructive'
          });
        } else {
          onPairAssignDragon(activePairIndex, dragon);
        }
      }
      setActivePairIndex(null);
      setShowDragonDeck(false);
      return;
    }

    // Fallback: assign to any available hero without a dragon of the same faction
    const heroWithSameFaction = selectedPairs.find(pair => pair.hero.faction === dragon.faction && !pair.dragon && (pair.hero.rarity ?? 0) >= dragon.rarity);
    if (heroWithSameFaction) {
      const pairIndex = selectedPairs.findIndex(pair => pair === heroWithSameFaction);
      onPairAssignDragon(pairIndex, dragon);
    }
    setShowDragonDeck(false);
  };
  return <div className="h-full flex flex-col space-y-3">
      {/* Selected Pairs Display */}
      <section className="bg-game-surface/50 p-2 sm:p-4 rounded-lg border border-game-accent flex-shrink-0" aria-label="Выбранная команда">
        <h1 className="text-sm sm:text-lg font-bold text-game-accent mb-2 sm:mb-4">
          Выбранная команда ({selectedPairs.length}/5)
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {Array.from({
          length: 5
        }, (_, index) => {
          const pair = selectedPairs[index];
          return <div key={index} className="relative overflow-hidden border border-game-accent/30 rounded-lg p-2 sm:p-3 min-h-[160px] sm:min-h-[200px]">
                {pair ? <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-game-accent font-medium">Пара {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2 items-start justify-items-center">
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Герой</div>
                        <CardDisplay card={pair.hero} showSellButton={false} className="w-[60px] h-[120px] sm:w-[80px] sm:h-[160px] md:w-[90px] md:h-[180px] lg:w-[100px] lg:h-[200px]" onClick={e => {
                    e.stopPropagation();
                    setPreviewCard(pair.hero);
                    setPreviewAction(null);
                    setPreviewDeleteAction({
                      label: 'Удалить героя из команды',
                      action: () => onPairRemove(index)
                    });
                  }} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Дракон</div>
                        {pair.dragon ? <CardDisplay card={pair.dragon} showSellButton={false} className="w-[60px] h-[120px] sm:w-[80px] sm:h-[160px] md:w-[90px] md:h-[180px] lg:w-[100px] lg:h-[200px]" onClick={e => {
                    e.stopPropagation();
                    setPreviewCard(pair.dragon!);
                    setPreviewAction(null);
                    setPreviewDeleteAction({
                      label: 'Удалить дракона из команды',
                      action: () => onPairRemoveDragon(index)
                    });
                  }} /> : <button type="button" onClick={() => {
                    setActivePairIndex(index);
                    setShowDragonDeck(true);
                  }} className="w-8 h-10 sm:w-12 sm:h-14 border border-dashed border-game-accent/30 rounded flex items-center justify-center text-xs text-game-accent/70 hover:text-game-accent hover:border-game-accent transition">
                            Выбрать дракона
                          </button>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onPairRemove(index)} className="w-full text-xs">
                      Удалить
                    </Button>
                  </div> : <div className="h-full flex items-center justify-center text-game-accent/50 text-xs sm:text-sm">
                    Пустой слот
                  </div>}
              </div>;
        })}
        </div>
      </section>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-shrink-0">
        <Button onClick={() => setShowHeroDeck(true)} className="h-20 sm:h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80">
          <div className="text-sm sm:text-lg font-bold">Колода героев</div>
          <Badge variant="secondary">{heroes.length} карт</Badge>
        </Button>

        <Button onClick={() => {
        setActivePairIndex(null);
        setShowDragonDeck(true);
      }} className="h-20 sm:h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80">
          <div className="text-sm sm:text-lg font-bold">Колода драконов</div>
          <Badge variant="secondary">{dragons.length} карт</Badge>
        </Button>
      </div>

      {/* Hero Deck Dialog */}
      <Dialog open={showHeroDeck} onOpenChange={setShowHeroDeck}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-game-surface border-game-accent overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto overflow-x-hidden p-4 justify-items-center">
            {heroes.map(hero => {
            const isSelected = isHeroSelected(hero);
            const teamFull = selectedPairs.length >= 5;
            const canSelect = !isSelected && !teamFull;
            return <div key={hero.id} className={`cursor-pointer transition-all ${isSelected ? 'opacity-50' : 'hover:scale-105'}`} onClick={() => canSelect && handleHeroSelect(hero)}>
                  <CardDisplay card={hero} showSellButton={false} onClick={e => {
                e.stopPropagation();
                setPreviewCard(hero);
                setPreviewAction(canSelect ? {
                  label: 'Выбрать героя',
                  action: () => handleHeroSelect(hero)
                } : null);
                setPreviewDeleteAction(null);
              }} />
                  <div className="text-center text-xs text-game-accent mt-1">
                    {isSelected ? 'Выбран' : teamFull ? 'Просмотр' : ''}
                  </div>
                </div>;
          })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Deck Dialog */}
      <Dialog open={showDragonDeck} onOpenChange={open => {
      setShowDragonDeck(open);
      if (!open) setActivePairIndex(null);
    }}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-game-surface border-game-accent overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto overflow-x-hidden p-4 justify-items-center">
            {(activePairIndex !== null ? getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity) : dragons).map(dragon => {
            const isSelected = isDragonSelected(dragon);
            const canAssign = activePairIndex !== null ? !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected : false;
            return <div key={dragon.id} className={`cursor-pointer transition-all ${activePairIndex !== null ? !canAssign ? 'opacity-50 pointer-events-none' : 'hover:scale-105' : 'hover:scale-105'}`} onClick={() => canAssign && handleDragonSelect(dragon)}>
                  <CardDisplay card={dragon} showSellButton={false} onClick={e => {
                e.stopPropagation();
                setPreviewCard(dragon);
                const canAssignHere = activePairIndex !== null && !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected;
                setPreviewAction(canAssignHere ? {
                  label: 'Назначить дракона',
                  action: () => handleDragonSelect(dragon)
                } : null);
                setPreviewDeleteAction(null);
              }} />
                  <div className="text-center text-xs text-game-accent mt-1">
                    {isSelected ? 'Выбран' : activePairIndex !== null ? selectedPairs[activePairIndex]?.hero.faction : 'Просмотр'}
                  </div>
                </div>;
          })}
            {activePairIndex !== null && getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity).length === 0 && <div className="col-span-full text-center text-game-accent/60 text-sm">
                Нет доступных драконов для выбранного героя
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Preview Modal */}
      <CardPreviewModal card={previewCard} open={!!previewCard} onClose={() => {
      setPreviewCard(null);
      setPreviewAction(null);
      setPreviewDeleteAction(null);
    }} actionLabel={previewAction?.label} onAction={previewAction ? () => {
      previewAction.action();
      setPreviewCard(null);
      setPreviewAction(null);
      setPreviewDeleteAction(null);
    } : undefined} deleteLabel={previewDeleteAction?.label} onDelete={previewDeleteAction ? () => {
      previewDeleteAction.action();
      setPreviewCard(null);
      setPreviewDeleteAction(null);
      setPreviewAction(null);
    } : undefined} />
    </div>;
};