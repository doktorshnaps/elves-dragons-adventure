import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { CardDisplay } from "./CardDisplay";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { DragonEggTimer } from "./DragonEggTimer";

export const TeamCards = () => {
  const { toast } = useToast();
  const { eggs, addEgg, removeEgg } = useDragonEggs();
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: CardType[] }>) => {
      setCards(e.detail.cards);
    };

    const handleStorageChange = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSellCard = (card: CardType) => {
    const newCards = cards.filter(c => c.id !== card.id);
    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const price = getCardPrice(card.rarity);
    const currentBalance = Number(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} токенов`,
    });
  };

  const handleCardSelect = (card: CardType) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleUpgrade = () => {
    if (selectedCards.length !== 2) return;

    const upgradedCard = upgradeCard(selectedCards[0], selectedCards[1]);
    
    if (!upgradedCard) {
      toast({
        title: "Ошибка улучшения",
        description: "Выбранные карты должны быть одинаковыми и иметь одинаковую редкость",
        variant: "destructive",
      });
      return;
    }

    // Remove the selected cards from the player's collection
    const newCards = cards.filter(c => !selectedCards.find(sc => sc.id === c.id));

    // If it's a pet, create a dragon egg
    if (selectedCards[0].type === 'pet') {
      addEgg(upgradedCard, upgradedCard.rarity);
      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      // For heroes, add the upgraded card immediately
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    setSelectedCards([]);
  };

  const heroes = cards.filter(card => card.type === 'character');
  const isPetActive = (pet: CardType): boolean => {
    if (!pet.faction) return false;
    return heroes.some(hero => 
      hero.type === 'character' && 
      hero.faction === pet.faction && 
      hero.rarity >= pet.rarity
    );
  };

  return (
    <div className="space-y-4">
      {/* Dragon Eggs Display */}
      {eggs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {eggs.map((egg) => (
            <DragonEggTimer
              key={egg.id}
              rarity={egg.rarity}
              petName={egg.petName}
              createdAt={egg.createdAt}
              onHatch={() => removeEgg(egg.id)}
            />
          ))}
        </div>
      )}

      {selectedCards.length > 0 && (
        <div className="flex items-center justify-between bg-game-surface p-4 rounded-lg">
          <span className="text-white">
            Выбрано карт: {selectedCards.length}/2
          </span>
          {selectedCards.length === 2 && (
            <Button
              onClick={handleUpgrade}
              className="bg-game-accent hover:bg-game-accent/80"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Улучшить
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {cards.length > 0 ? (
          cards.map((card) => (
            <div
              key={card.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedCards.find(c => c.id === card.id)
                  ? 'ring-2 ring-game-accent rounded-lg'
                  : ''
              }`}
              onClick={() => handleCardSelect(card)}
            >
              <CardDisplay
                card={card}
                showSellButton={true}
                onSell={handleSellCard}
                isActive={card.type === 'character' || isPetActive(card)}
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
  );
};
