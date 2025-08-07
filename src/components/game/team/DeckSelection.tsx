import { useState } from 'react';
import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { CardDisplay } from "../CardDisplay";

interface DeckSelectionProps {
  cards: CardType[];
  selectedPairs: TeamPair[];
  onPairSelect: (hero: CardType, dragon?: CardType) => void;
  onPairRemove: (index: number) => void;
}

export interface TeamPair {
  hero: CardType;
  dragon?: CardType;
}

export const DeckSelection = ({ 
  cards, 
  selectedPairs, 
  onPairSelect, 
  onPairRemove 
}: DeckSelectionProps) => {
  const [showHeroDeck, setShowHeroDeck] = useState(false);
  const [showDragonDeck, setShowDragonDeck] = useState(false);

  const heroes = cards.filter(card => card.type === 'character');
  const dragons = cards.filter(card => card.type === 'pet');

  const isHeroSelected = (hero: CardType) => {
    return selectedPairs.some(pair => pair.hero.id === hero.id);
  };

  const isDragonSelected = (dragon: CardType) => {
    return selectedPairs.some(pair => pair.dragon?.id === dragon.id);
  };

  const getAvailableDragons = (heroFaction?: string) => {
    if (!heroFaction) return [];
    return dragons.filter(dragon => 
      dragon.faction === heroFaction && !isDragonSelected(dragon)
    );
  };

  const handleHeroSelect = (hero: CardType) => {
    if (selectedPairs.length >= 5) return;
    
    const availableDragons = getAvailableDragons(hero.faction);
    onPairSelect(hero, availableDragons[0]);
    setShowHeroDeck(false);
  };

  const handleDragonSelect = (dragon: CardType) => {
    // Dragons can only be selected if there's a hero of the same faction
    const heroWithSameFaction = selectedPairs.find(pair => 
      pair.hero.faction === dragon.faction && !pair.dragon
    );
    
    if (heroWithSameFaction) {
      const pairIndex = selectedPairs.findIndex(pair => pair === heroWithSameFaction);
      onPairRemove(pairIndex);
      onPairSelect(heroWithSameFaction.hero, dragon);
    }
    setShowDragonDeck(false);
  };

  return (
    <div className="space-y-6">
      {/* Selected Pairs Display */}
      <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
        <h3 className="text-lg font-bold text-game-accent mb-4">
          Выбранная команда ({selectedPairs.length}/5)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, index) => {
            const pair = selectedPairs[index];
            return (
              <div key={index} className="border border-game-accent/30 rounded-lg p-3 min-h-[200px]">
                {pair ? (
                  <div className="space-y-2">
                    <div className="text-sm text-game-accent font-medium">Пара {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Герой</div>
                        <CardDisplay card={pair.hero} showSellButton={false} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-game-accent/70">Дракон</div>
                        {pair.dragon ? (
                          <CardDisplay card={pair.dragon} showSellButton={false} />
                        ) : (
                          <div className="w-full h-20 border border-dashed border-game-accent/30 rounded flex items-center justify-center text-xs text-game-accent/50">
                            Нет дракона
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPairRemove(index)}
                      className="w-full text-xs"
                    >
                      Удалить
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-game-accent/50 text-sm">
                    Пустой слот
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deck Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => setShowHeroDeck(true)}
          className="h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80"
          disabled={selectedPairs.length >= 5}
        >
          <div className="text-lg font-bold">Колода героев</div>
          <Badge variant="secondary">{heroes.length} карт</Badge>
        </Button>

        <Button
          onClick={() => setShowDragonDeck(true)}
          className="h-32 flex flex-col items-center justify-center space-y-2 bg-game-surface border-2 border-game-accent hover:bg-game-surface/80"
        >
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
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className={`cursor-pointer transition-all ${
                  isHeroSelected(hero) ? 'opacity-50 pointer-events-none' : 'hover:scale-105'
                }`}
                onClick={() => !isHeroSelected(hero) && handleHeroSelect(hero)}
              >
                <CardDisplay card={hero} showSellButton={false} />
                {isHeroSelected(hero) && (
                  <div className="text-center text-xs text-game-accent mt-1">Выбран</div>
                )}
              </div>
            ))}
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
            {dragons.map((dragon) => {
              const canSelect = selectedPairs.some(pair => 
                pair.hero.faction === dragon.faction && !pair.dragon
              );
              const isSelected = isDragonSelected(dragon);
              
              return (
                <div
                  key={dragon.id}
                  className={`cursor-pointer transition-all ${
                    !canSelect || isSelected 
                      ? 'opacity-50 pointer-events-none' 
                      : 'hover:scale-105'
                  }`}
                  onClick={() => canSelect && !isSelected && handleDragonSelect(dragon)}
                >
                  <CardDisplay card={dragon} showSellButton={false} />
                  <div className="text-center text-xs text-game-accent mt-1">
                    {isSelected 
                      ? 'Выбран' 
                      : canSelect 
                        ? dragon.faction 
                        : 'Нет героя'
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};