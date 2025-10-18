import { useState, useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDisplay } from "../CardDisplay";
import { CardPreviewModal } from "../cards/CardPreviewModal";
import { NFTTransferModal } from "./NFTTransferModal";
import { useToast } from "@/hooks/use-toast";
import { useCardInstances } from "@/hooks/useCardInstances";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
import { ArrowUpDown, Sparkles, Swords } from "lucide-react";
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
  const [heroSortBy, setHeroSortBy] = useState<'none' | 'power' | 'rarity'>('none');
  const [dragonSortBy, setDragonSortBy] = useState<'none' | 'power' | 'rarity'>('none');
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
  const heroes = useMemo(() => {
    const filtered = localCards.filter(card => card.type === 'character');
    if (heroSortBy === 'power') {
      return [...filtered].sort((a, b) => b.power - a.power);
    }
    if (heroSortBy === 'rarity') {
      return [...filtered].sort((a, b) => b.rarity - a.rarity);
    }
    return filtered;
  }, [localCards, heroSortBy]);

  const dragons = useMemo(() => {
    const filtered = localCards.filter(card => card.type === 'pet');
    if (dragonSortBy === 'power') {
      return [...filtered].sort((a, b) => b.power - a.power);
    }
    if (dragonSortBy === 'rarity') {
      return [...filtered].sort((a, b) => b.rarity - a.rarity);
    }
    return filtered;
  }, [localCards, dragonSortBy]);
  const isHeroSelected = (hero: CardType) => {
    // Для NFT карт сравниваем как по ID, так и по контракту/токену
    return selectedPairs.some(pair => {
      if (pair.hero.id === hero.id) return true;
      // Дополнительная проверка для NFT карт
      if (hero.isNFT && pair.hero.isNFT && 
          hero.nftContractId === pair.hero.nftContractId && 
          hero.nftTokenId === pair.hero.nftTokenId) {
        return true;
      }
      return false;
    });
  };
  const isDragonSelected = (dragon: CardType) => {
    return selectedPairs.some(pair => {
      if (pair.dragon?.id === dragon.id) return true;
      // Дополнительная проверка для NFT карт
      if (dragon.isNFT && pair.dragon?.isNFT && 
          dragon.nftContractId === pair.dragon.nftContractId && 
          dragon.nftTokenId === pair.dragon.nftTokenId) {
        return true;
      }
      return false;
    });
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
      <section 
        className="bg-gradient-to-br from-game-surface/90 via-game-surface/70 to-game-surface/90 backdrop-blur-sm p-2 sm:p-4 rounded-xl border-2 border-game-primary/40 shadow-[0_0_20px_rgba(155,135,245,0.15)] flex-shrink-0" 
        aria-label="Выбранная команда"
      >
        <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-game-primary via-game-accent to-game-primary bg-clip-text text-transparent mb-2 sm:mb-4 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
          Выбранная команда ({selectedPairs.length}/5)
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {Array.from({
          length: 5
        }, (_, index) => {
          const pair = selectedPairs[index];
          return <div key={index} className="relative overflow-hidden border-2 border-game-primary/30 rounded-xl p-2 sm:p-3 min-h-[160px] sm:min-h-[200px] bg-gradient-to-b from-game-surface/50 to-game-background/50 hover:border-game-accent/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                {pair ? <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-game-primary font-medium">Пара {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2 items-start justify-items-center">
                      <div className="space-y-1">
                        <div className="text-xs text-game-primary/80 font-medium">Герой</div>
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
                        <div className="text-xs text-game-primary/80 font-medium">Дракон</div>
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
                  }} className="w-8 h-10 sm:w-12 sm:h-14 border-2 border-dashed border-game-primary/40 rounded-lg flex items-center justify-center text-xs text-game-primary/70 hover:text-game-accent hover:border-game-accent hover:shadow-[0_0_10px_rgba(217,70,239,0.3)] transition-all duration-300">
                            Выбрать дракона
                          </button>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onPairRemove(index)} className="w-full text-xs border-game-primary/40 text-game-primary hover:border-game-accent hover:text-game-accent hover:bg-game-accent/10">
                      Удалить
                    </Button>
                  </div> : <div className="h-full flex items-center justify-center text-game-primary/40 text-xs sm:text-sm">
                    Пустой слот
                  </div>}
              </div>;
        })}
        </div>
      </section>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-shrink-0">
        <Button 
          onClick={() => setShowHeroDeck(true)} 
          className="h-20 sm:h-32 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-game-surface/90 via-game-surface/70 to-game-surface/90 backdrop-blur-sm border-2 border-game-primary/40 hover:border-game-accent/60 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all duration-300 group"
        >
          <div className="text-sm sm:text-lg font-bold text-game-primary group-hover:text-game-accent transition-colors">Колода героев</div>
          <Badge variant="secondary" className="bg-game-primary/20 text-game-primary border-game-primary/30 group-hover:bg-game-accent/20 group-hover:text-game-accent group-hover:border-game-accent/30">{heroes.length} карт</Badge>
        </Button>

        <Button 
          onClick={() => {
            setActivePairIndex(null);
            setShowDragonDeck(true);
          }} 
          className="h-20 sm:h-32 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-game-surface/90 via-game-surface/70 to-game-surface/90 backdrop-blur-sm border-2 border-game-primary/40 hover:border-game-accent/60 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all duration-300 group"
        >
          <div className="text-sm sm:text-lg font-bold text-game-primary group-hover:text-game-accent transition-colors">Колода драконов</div>
          <Badge variant="secondary" className="bg-game-primary/20 text-game-primary border-game-primary/30 group-hover:bg-game-accent/20 group-hover:text-game-accent group-hover:border-game-accent/30">{dragons.length} карт</Badge>
        </Button>
      </div>

      {/* Hero Deck Dialog */}
      <Dialog open={showHeroDeck} onOpenChange={setShowHeroDeck}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-gradient-to-br from-game-surface/95 via-game-background/90 to-game-surface/95 backdrop-blur-md border-2 border-game-primary/40 shadow-[0_0_30px_rgba(155,135,245,0.2)] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-game-primary via-game-accent to-game-primary bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
            <Button
              size="sm"
              variant={heroSortBy === 'power' ? 'default' : 'outline'}
              onClick={() => setHeroSortBy(heroSortBy === 'power' ? 'none' : 'power')}
              className="flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              По силе
              {heroSortBy === 'power' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={heroSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={() => setHeroSortBy(heroSortBy === 'rarity' ? 'none' : 'rarity')}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {heroSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center w-full">
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
                  <div className="text-center text-xs text-game-primary font-medium mt-1">
                    {isSelected ? 'Выбран' : teamFull ? 'Просмотр' : ''}
                  </div>
                 </div>;
          })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Deck Dialog */}
      <Dialog open={showDragonDeck} onOpenChange={open => {
      setShowDragonDeck(open);
      if (!open) setActivePairIndex(null);
    }}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[80vh] bg-gradient-to-br from-game-surface/95 via-game-background/90 to-game-surface/95 backdrop-blur-md border-2 border-game-primary/40 shadow-[0_0_30px_rgba(155,135,245,0.2)] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-game-primary via-game-accent to-game-primary bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
            <Button
              size="sm"
              variant={dragonSortBy === 'power' ? 'default' : 'outline'}
              onClick={() => setDragonSortBy(dragonSortBy === 'power' ? 'none' : 'power')}
              className="flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              По силе
              {dragonSortBy === 'power' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant={dragonSortBy === 'rarity' ? 'default' : 'outline'}
              onClick={() => setDragonSortBy(dragonSortBy === 'rarity' ? 'none' : 'rarity')}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              По редкости
              {dragonSortBy === 'rarity' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center w-full">
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
                  <div className="text-center text-xs text-game-primary font-medium mt-1">
                    {isSelected ? 'Выбран' : activePairIndex !== null ? selectedPairs[activePairIndex]?.hero.faction : 'Просмотр'}
                  </div>
                </div>;
          })}
             {activePairIndex !== null && getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity).length === 0 && <div className="col-span-full text-center text-game-primary/60 text-sm">
                 Нет доступных драконов для выбранного героя
               </div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Preview Modal */}
      {/* NFT Transfer Warning Modal */}
      <NFTTransferModal />

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