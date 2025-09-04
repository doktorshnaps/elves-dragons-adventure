import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDisplay } from "../CardDisplay";
import { CardPreviewModal } from "../cards/CardPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { useCardHealthSync } from "@/hooks/useCardHealthSync";
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
  const [previewAction, setPreviewAction] = useState<{ label: string; action: () => void } | null>(null);
  const [previewDeleteAction, setPreviewDeleteAction] = useState<{ label: string; action: () => void } | null>(null);
  const [localCards, setLocalCards] = useState<CardType[]>(cards);
  const { toast } = useToast();
  
  // Интеграция NFT карт
  const { nftCards, isLoading: nftLoading } = useNFTCardIntegration();

  // Use health synchronization for cards
  useCardHealthSync({
    cards: localCards,
    onCardsUpdate: setLocalCards
  });

  // Обновляем локальные карты при изменении пропсов и NFT карт
  useEffect(() => {
    const combinedCards = [...cards, ...nftCards];
    setLocalCards(combinedCards);
  }, [cards, nftCards]);

  // Слушаем события обновления карт для немедленной синхронизации
  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: CardType[] }>) => {
      if (e.detail?.cards) {
        setLocalCards(e.detail.cards);
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    };
  }, []);
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
    if (selectedPairs.length >= 5) return;
    onPairSelect(hero);
    setShowHeroDeck(false);
  };
  const handleDragonSelect = (dragon: CardType) => {
    if (activePairIndex !== null) {
      const pair = selectedPairs[activePairIndex];
      if (pair) {
        if (pair.hero.faction !== dragon.faction) {
          toast({ title: 'Неверная фракция', description: 'Дракон должен быть той же фракции, что и герой', variant: 'destructive' });
        } else if ((pair.hero.rarity ?? 0) < dragon.rarity) {
          toast({ title: 'Недостаточный ранг героя', description: 'Герой может управлять драконом своего ранга или ниже', variant: 'destructive' });
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
  return <div className="space-y-6">
      {/* Selected Pairs Display */}
      <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
        <h3 className="text-lg font-bold text-game-accent mb-4">
          Выбранная команда ({selectedPairs.length}/5)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({
          length: 5
        }, (_, index) => {
          const pair = selectedPairs[index];
          return <div key={index} className="relative overflow-hidden border border-game-accent/30 rounded-lg p-3 min-h-[200px]">
                {pair ? <div className="space-y-2">
                    <div className="text-sm text-game-accent font-medium">Пара {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2 items-start justify-items-center">
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Герой</div>
                        <CardDisplay card={pair.hero} showSellButton={false} className="w-[80px] h-[160px] sm:w-[100px] sm:h-[200px] md:w-[110px] md:h-[220px] lg:w-[120px] lg:h-[240px]" onClick={(e) => { e.stopPropagation(); setPreviewCard(pair.hero); setPreviewAction(null); setPreviewDeleteAction({ label: 'Удалить героя из команды', action: () => onPairRemove(index) }); }} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Дракон</div>
                        {pair.dragon ? <CardDisplay card={pair.dragon} showSellButton={false} className="w-[80px] h-[160px] sm:w-[100px] sm:h-[200px] md:w-[110px] md:h-[220px] lg:w-[120px] lg:h-[240px]" onClick={(e) => { e.stopPropagation(); setPreviewCard(pair.dragon!); setPreviewAction(null); setPreviewDeleteAction({ label: 'Удалить дракона из команды', action: () => onPairRemoveDragon(index) }); }} /> : <button type="button" onClick={() => {
                    setActivePairIndex(index);
                    setShowDragonDeck(true);
                  }} className="w-12 h-14 border border-dashed border-game-accent/30 rounded flex items-center justify-center text-xs text-game-accent/70 hover:text-game-accent hover:border-game-accent transition py-0 px-[1px] text-center mx-[44px] my-[7px]">
                            Выбрать дракона
                          </button>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onPairRemove(index)} className="w-full text-xs">
                      Удалить
                    </Button>
                  </div> : <div className="h-full flex items-center justify-center text-game-accent/50 text-sm">
                    Пустой слот
                  </div>}
              </div>;
        })}
        </div>
      </div>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => setShowHeroDeck(true)} className="h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80">
          <div className="text-lg font-bold">Колода героев</div>
          <Badge variant="secondary">{heroes.length} карт</Badge>
        </Button>

        <Button onClick={() => setShowDragonDeck(true)} className="h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80">
          <div className="text-lg font-bold">Колода драконов</div>
          <Badge variant="secondary">{dragons.length} карт</Badge>
        </Button>
      </div>

      {/* Hero Deck Dialog */}
      <Dialog open={showHeroDeck} onOpenChange={setShowHeroDeck}>
        <DialogContent className="max-w-4xl h-[80vh] bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Выберите героя</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto p-4">
            {heroes.map(hero => {
              const isSelected = isHeroSelected(hero);
              const teamFull = selectedPairs.length >= 5;
              const canSelect = !isSelected && !teamFull;
              return (
                <div key={hero.id} className={`cursor-pointer transition-all ${isSelected ? 'opacity-50' : 'hover:scale-105'}`} onClick={() => canSelect && handleHeroSelect(hero)}>
                  <CardDisplay card={hero} showSellButton={false} onClick={(e) => { e.stopPropagation(); setPreviewCard(hero); setPreviewAction(canSelect ? { label: 'Выбрать героя', action: () => handleHeroSelect(hero) } : null); setPreviewDeleteAction(null); }} />
                  <div className="text-center text-xs text-game-accent mt-1">
                    {isSelected ? 'Выбран' : teamFull ? 'Просмотр' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dragon Deck Dialog */}
      <Dialog open={showDragonDeck} onOpenChange={setShowDragonDeck}>
        <DialogContent className="max-w-4xl h-[80vh] bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-game-accent">Выберите дракона</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto p-4">
            {(activePairIndex !== null ? getAvailableDragons(selectedPairs[activePairIndex]?.hero.faction, selectedPairs[activePairIndex]?.hero.rarity) : dragons).map(dragon => {
            const isSelected = isDragonSelected(dragon);
            const canAssign = activePairIndex !== null ? !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected : false;
            return <div key={dragon.id} className={`cursor-pointer transition-all ${activePairIndex !== null ? !canAssign ? 'opacity-50 pointer-events-none' : 'hover:scale-105' : 'hover:scale-105'}`} onClick={() => canAssign && handleDragonSelect(dragon)}>
                  <CardDisplay card={dragon} showSellButton={false} onClick={(e) => { e.stopPropagation(); setPreviewCard(dragon); const canAssignHere = (activePairIndex !== null) && !!selectedPairs[activePairIndex] && !selectedPairs[activePairIndex]?.dragon && selectedPairs[activePairIndex]?.hero.faction === dragon.faction && (selectedPairs[activePairIndex]?.hero.rarity ?? 0) >= dragon.rarity && !isSelected; setPreviewAction(canAssignHere ? { label: 'Назначить дракона', action: () => handleDragonSelect(dragon) } : null); setPreviewDeleteAction(null); }} />
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
      <CardPreviewModal
        card={previewCard}
        open={!!previewCard}
        onClose={() => { setPreviewCard(null); setPreviewAction(null); setPreviewDeleteAction(null); }}
        actionLabel={previewAction?.label}
        onAction={previewAction ? () => { previewAction.action(); setPreviewCard(null); setPreviewAction(null); setPreviewDeleteAction(null); } : undefined}
        deleteLabel={previewDeleteAction?.label}
        onDelete={previewDeleteAction ? () => { previewDeleteAction.action(); setPreviewCard(null); setPreviewDeleteAction(null); setPreviewAction(null); } : undefined}
      />
    </div>;
};