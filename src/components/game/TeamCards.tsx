import { Card as CardType } from "@/types/cards";
import { useTeamCards } from "./team/useTeamCards";
import { SelectedCardsPanel } from "./team/SelectedCardsPanel";
import { CardGroup } from "./team/CardGroup";

export const TeamCards = () => {
  const {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  } = useTeamCards();

  const heroes = cards.filter(card => card.type === 'character');
  
  const isPetActive = (pet: CardType): boolean => {
    if (!pet.faction) return false;
    return heroes.some(hero => 
      hero.type === 'character' && 
      hero.faction === pet.faction && 
      hero.rarity >= pet.rarity
    );
  };

  const groupedCards = cards.reduce<{ [key: string]: CardType[] }>((acc, card) => {
    const key = `${card.name}-${card.rarity}-${card.type}-${card.faction || ''}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(card);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {selectedCards.length > 0 && (
        <div className="flex-shrink-0">
          <SelectedCardsPanel 
            selectedCards={selectedCards}
            onUpgrade={handleUpgrade}
          />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {Object.values(groupedCards).length > 0 ? (
            Object.values(groupedCards).map((cardGroup) => (
              <div key={cardGroup[0].id} className="flex justify-center">
                <CardGroup
                  card={cardGroup[0]}
                  count={cardGroup.length}
                  isSelected={selectedCards.some(c => c.id === cardGroup[0].id)}
                  isActive={cardGroup[0].type === 'character' || isPetActive(cardGroup[0])}
                  onSelect={() => handleCardSelect(cardGroup[0], cardGroup.length)}
                  onSell={handleSellCard}
                  onUpgrade={handleUpgrade}
                />
              </div>
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center py-8">
              У вас пока нет карт
            </p>
          )}
        </div>
      </div>
    </div>
  );
};